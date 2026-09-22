import { getDb } from "./mongodb";

const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QBO_API_BASE = "https://quickbooks.api.intuit.com/v3/company";

interface QboTokenDoc {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  connectedAt: string;
}

export function isQboConfigured(): boolean {
  return Boolean(process.env.QBO_CLIENT_ID && process.env.QBO_CLIENT_SECRET);
}

export function getQboRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/admin/qbo/callback`;
}

export function buildQboAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID!,
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: getQboRedirectUri(),
    response_type: "code",
    access_type: "offline",
    state,
  });
  return `${QBO_AUTH_URL}?${params}`;
}

async function getTokenDoc(): Promise<(QboTokenDoc & { _id: string }) | null> {
  try {
    const db = await getDb();
    return (await db.collection("settings").findOne({ _id: "quickbooks" as any })) as any;
  } catch {
    return null;
  }
}

async function saveTokenDoc(data: Partial<QboTokenDoc>): Promise<void> {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "quickbooks" as any },
    { $set: data },
    { upsert: true }
  );
}

export async function exchangeCodeForTokens(code: string, realmId: string): Promise<void> {
  const creds = Buffer.from(
    `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getQboRedirectUri(),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`QBO token exchange failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const now = Date.now();
  await saveTokenDoc({
    realmId,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpiresAt: now + data.expires_in * 1000,
    refreshExpiresAt: now + data.x_refresh_token_expires_in * 1000,
    connectedAt: new Date().toISOString(),
  });
}

async function refreshAccessToken(doc: QboTokenDoc & { _id: string }): Promise<string> {
  const creds = Buffer.from(
    `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: doc.refreshToken,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`QBO token refresh failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const now = Date.now();
  const updates: Partial<QboTokenDoc> = {
    accessToken: data.access_token,
    accessExpiresAt: now + data.expires_in * 1000,
  };
  if (data.refresh_token) {
    updates.refreshToken = data.refresh_token;
    updates.refreshExpiresAt =
      now + (data.x_refresh_token_expires_in ?? 8_640_000) * 1000;
  }
  await saveTokenDoc(updates);
  return data.access_token;
}

async function getValidToken(): Promise<{ token: string; realmId: string }> {
  const doc = await getTokenDoc();
  if (!doc) throw new Error("QuickBooks is not connected.");
  if (Date.now() > doc.refreshExpiresAt) {
    throw new Error("QuickBooks refresh token has expired. Please reconnect in admin settings.");
  }
  const token =
    Date.now() > doc.accessExpiresAt - 60_000
      ? await refreshAccessToken(doc)
      : doc.accessToken;
  return { token, realmId: doc.realmId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function qboGet(path: string): Promise<any> {
  const { token, realmId } = await getValidToken();
  const res = await fetch(`${QBO_API_BASE}/${realmId}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`QBO GET ${path} error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function qboPost(path: string, body: unknown): Promise<any> {
  const { token, realmId } = await getValidToken();
  const res = await fetch(`${QBO_API_BASE}/${realmId}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`QBO POST ${path} error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function findOrCreateCustomer(
  name: string,
  email?: string,
  phone?: string
): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");
  const query = `SELECT * FROM Customer WHERE DisplayName = '${safeName}' MAXRESULTS 1`;
  const data = await qboGet(`query?query=${encodeURIComponent(query)}`);
  const existing = data?.QueryResponse?.Customer?.[0];
  if (existing) return String(existing.Id);

  const payload: Record<string, unknown> = { DisplayName: name };
  if (email) payload.PrimaryEmailAddr = { Address: email };
  if (phone) payload.PrimaryPhone = { FreeFormNumber: phone };
  const result = await qboPost("customer", payload);
  return String(result.Customer.Id);
}

export interface QboInvoiceInput {
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{ description: string; amount: number }>;
}

/** Push an invoice to QBO and return the QBO Invoice Id. */
export async function pushInvoiceToQbo(input: QboInvoiceInput): Promise<string> {
  const serviceItemId = process.env.QBO_SERVICE_ITEM_ID || "1";
  const customerId = await findOrCreateCustomer(
    input.customerName,
    input.customerEmail,
    input.customerPhone
  );

  const dueDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const lines = input.items.map((item, i) => ({
    Id: String(i + 1),
    LineNum: i + 1,
    Description: item.description,
    Amount: parseFloat(item.amount.toFixed(2)),
    DetailType: "SalesItemLineDetail",
    SalesItemLineDetail: {
      ItemRef: { value: serviceItemId },
      Qty: 1,
      UnitPrice: parseFloat(item.amount.toFixed(2)),
    },
  }));

  const result = await qboPost("invoice", {
    DocNumber: input.invoiceNumber,
    CustomerRef: { value: customerId },
    DueDate: dueDateStr,
    Line: lines,
    GlobalTaxCalculation: "TaxExclusive",
    ...(input.customerEmail ? { BillEmail: { Address: input.customerEmail } } : {}),
  });

  return String(result.Invoice.Id);
}

export interface QboStatus {
  configured: boolean;
  connected: boolean;
  connectedAt?: string;
  realmId?: string;
  refreshExpiresAt?: number;
}

export async function getQboStatus(): Promise<QboStatus> {
  const configured = isQboConfigured();
  if (!configured) return { configured: false, connected: false };
  const doc = await getTokenDoc();
  if (!doc) return { configured: true, connected: false };
  return {
    configured: true,
    connected: true,
    connectedAt: doc.connectedAt,
    realmId: doc.realmId,
    refreshExpiresAt: doc.refreshExpiresAt,
  };
}

export async function disconnectQbo(): Promise<void> {
  const db = await getDb();
  await db.collection("settings").deleteOne({ _id: "quickbooks" as any });
}
