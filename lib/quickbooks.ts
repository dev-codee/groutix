import { createHash } from "node:crypto";
import { getDb } from "./mongodb";

// The OAuth endpoints are shared, but the API host is not: Development keys from
// developer.intuit.com only work against the sandbox host, and Production keys
// only against the live one. Mismatching them gives a clean OAuth handshake
// followed by 401s on every call, so this is driven by QBO_ENVIRONMENT.
const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export function isQboSandbox(): boolean {
  return (process.env.QBO_ENVIRONMENT || "production").toLowerCase() === "sandbox";
}

function qboApiBase(): string {
  return isQboSandbox()
    ? "https://sandbox-quickbooks.api.intuit.com/v3/company"
    : "https://quickbooks.api.intuit.com/v3/company";
}

interface QboTokenDoc {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  connectedAt: string;
  refreshHardExpiresAt?: number;
}

export function isQboConfigured(): boolean {
  return Boolean(process.env.QBO_CLIENT_ID && process.env.QBO_CLIENT_SECRET);
}

function isLocalOrigin(origin?: string): boolean {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

/**
 * The callback URL registered with Intuit. Intuit requires the redirect_uri sent
 * on the token exchange to match the one that started the flow byte for byte, so
 * /connect and /callback must derive it the same way - both pass their own request
 * origin. Production always uses NEXT_PUBLIC_SITE_URL (so a preview deployment
 * can't mint a URI nobody registered); a localhost origin wins over it so the
 * flow can be completed against a dev server.
 */
export function getQboRedirectUri(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const base = (isLocalOrigin(requestOrigin) ? requestOrigin! : configured || requestOrigin || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/admin/qbo/callback`;
}

export function buildQboAuthUrl(state: string, requestOrigin?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID!,
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: getQboRedirectUri(requestOrigin),
    response_type: "code",
    access_type: "offline",
    state,
  });
  return `${QBO_AUTH_URL}?${params}`;
}

class QboReconnectError extends Error {}

async function getTokenDoc(): Promise<(QboTokenDoc & { _id: string }) | null> {
  const db = await getDb();
  return await db.collection("settings").findOne({ _id: "quickbooks" as any }) as (QboTokenDoc & { _id: string }) | null;
}

function tokenNeedsReconnect(doc: QboTokenDoc): boolean {
  return !doc.realmId || !doc.refreshToken || !Number.isFinite(doc.refreshExpiresAt)
    || Date.now() >= doc.refreshExpiresAt
    || (doc.refreshHardExpiresAt !== undefined && Date.now() >= doc.refreshHardExpiresAt);
}

async function saveTokenDoc(data: Partial<QboTokenDoc>): Promise<void> {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "quickbooks" as any },
    { $set: data },
    { upsert: true }
  );
}

export async function exchangeCodeForTokens(
  code: string,
  realmId: string,
  requestOrigin?: string
): Promise<void> {
  const creds = Buffer.from(
    `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Basic ${creds}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getQboRedirectUri(requestOrigin),
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
    ...(Number.isFinite(data.x_refresh_token_hard_expires_in) ? { refreshHardExpiresAt: now + data.x_refresh_token_hard_expires_in * 1000 } : {}),
  });
}

async function performTokenRefresh(doc: QboTokenDoc & { _id: string }): Promise<string> {
  const creds = Buffer.from(
    `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
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
    if (res.status === 401 || (res.status === 400 && txt.includes("invalid_grant"))) {
      throw new QboReconnectError("QuickBooks authorisation has expired or was revoked. Reconnect in Settings.");
    }
    throw new Error(`QBO token refresh failed (${res.status}).`);
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
  if (Number.isFinite(data.x_refresh_token_hard_expires_in)) {
    updates.refreshHardExpiresAt = now + data.x_refresh_token_hard_expires_in * 1000;
  }
  await saveTokenDoc(updates);
  return data.access_token;
}

// Multiple QBO reads may need the same renewal at once. Persist a rotated
// refresh token once before allowing those requests to continue.
let pendingRefresh: Promise<string> | null = null;
async function refreshAccessToken(doc: QboTokenDoc & { _id: string }): Promise<string> {
  if (!pendingRefresh) pendingRefresh = performTokenRefresh(doc).finally(() => { pendingRefresh = null; });
  return pendingRefresh;
}

async function getValidToken(): Promise<{ token: string; realmId: string }> {
  const doc = await getTokenDoc();
  if (!doc) throw new Error("QuickBooks is not connected.");
  if (tokenNeedsReconnect(doc)) {
    throw new QboReconnectError("QuickBooks authorisation has expired. Reconnect in Settings.");
  }
  const token =
    !doc.accessToken || !Number.isFinite(doc.accessExpiresAt) || Date.now() >= doc.accessExpiresAt - 60_000
      ? await refreshAccessToken(doc)
      : doc.accessToken;
  return { token, realmId: doc.realmId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function qboGet(path: string): Promise<any> {
  const { token, realmId } = await getValidToken();
  const res = await fetch(`${qboApiBase()}/${realmId}/${path}`, {
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new QboReconnectError("QuickBooks access could not be authorised. Reconnect in Settings.");
    throw new Error(`QBO GET ${path} error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function qboPost(path: string, body: unknown, requestId?: string): Promise<any> {
  const { token, realmId } = await getValidToken();
  const res = await fetch(`${qboApiBase()}/${realmId}/${path}${requestId ? `?requestid=${encodeURIComponent(requestId)}` : ""}`, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new QboReconnectError("QuickBooks access could not be authorised. Reconnect in Settings.");
    throw new Error(`QBO POST ${path} error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function findOrCreateCustomer(
  name: string,
  email?: string,
  phone?: string
): Promise<string> {
  const safeName = escapeQueryValue(name);
  const query = `SELECT * FROM Customer WHERE DisplayName = '${safeName}' MAXRESULTS 1`;
  const data = await qboGet(`query?query=${encodeURIComponent(query)}`);
  const existing = data?.QueryResponse?.Customer?.[0];
  if (existing) return String(existing.Id);

  const payload: Record<string, unknown> = { DisplayName: name };
  if (email) payload.PrimaryEmailAddr = { Address: email };
  if (phone) payload.PrimaryPhone = { FreeFormNumber: phone };
  const result = await qboPost("customer", payload, requestId("customer", name));
  return String(result.Customer.Id);
}

export interface QboInvoiceInput {
  customerId?: string;
  onCustomerResolved?: (id: string) => Promise<void>;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  /** Line amounts include this GST percentage. */
  gstRate: number;
  items: Array<{ description: string; amount: number }>;
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function requestId(kind: string, identity: string): string {
  return `${kind}-${createHash("sha256").update(identity).digest("hex").slice(0, 36)}`;
}

type TaxRate = { Id: string; Active?: boolean; RateValue: number };
type TaxCode = {
  Id: string; Name?: string; Active?: boolean; Hidden?: boolean; Taxable?: boolean;
  SalesTaxRateList?: { TaxRateDetail?: Array<{ TaxRateRef: { value: string }; TaxTypeApplicable?: string }> };
};

/** Resolve the company's real sales tax code; never guess an account-specific ID. */
async function salesTaxCode(gstRate: number): Promise<string> {
  const [codes, rates] = await Promise.all([
    qboGet(`query?query=${encodeURIComponent("SELECT * FROM TaxCode MAXRESULTS 1000")}`),
    qboGet(`query?query=${encodeURIComponent("SELECT * FROM TaxRate MAXRESULTS 1000")}`),
  ]);
  const rateMap = new Map<string, number>((rates.QueryResponse?.TaxRate || [])
    .filter((rate: TaxRate) => rate.Active !== false && Number.isFinite(Number(rate.RateValue)))
    .map((rate: TaxRate) => [String(rate.Id), Number(rate.RateValue)]));
  const matches = (codes.QueryResponse?.TaxCode || []).filter((code: TaxCode) => {
    if (code.Active === false || code.Hidden) return false;
    const details = code.SalesTaxRateList?.TaxRateDetail || [];
    if (!details.length) return gstRate === 0 && code.Taxable === false;
    if (details.some(detail => (detail.TaxTypeApplicable && detail.TaxTypeApplicable !== "TaxOnAmount") || !rateMap.has(String(detail.TaxRateRef.value)))) return false;
    const totalRate = details.reduce((sum, detail) => sum + rateMap.get(String(detail.TaxRateRef.value))!, 0);
    return Math.abs(totalRate - gstRate) < 0.00001;
  }) as TaxCode[];
  const configured = gstRate > 0 ? process.env.QBO_SALES_TAX_CODE_ID : undefined;
  const match = configured ? matches.find(code => String(code.Id) === configured) : matches[0];
  if (!match) throw new Error(`No active QuickBooks sales tax code matches ${gstRate}% GST${configured ? ` (configured code ${configured})` : ""}. Check the company's tax settings before retrying sync.`);
  return String(match.Id);
}

/** Create once, including retries after a lost response or failed local save. */
export async function pushInvoiceToQbo(input: QboInvoiceInput): Promise<string> {
  if (!input.invoiceNumber.trim() || !Number.isFinite(input.gstRate) || input.gstRate < 0
    || !input.items.length || input.items.some(item => !Number.isFinite(item.amount) || item.amount < 0)) {
    throw new Error("Invalid QuickBooks invoice amounts or GST rate.");
  }
  const existing = await qboGet(`query?query=${encodeURIComponent(`SELECT * FROM Invoice WHERE DocNumber = '${escapeQueryValue(input.invoiceNumber)}' MAXRESULTS 2`)}`);
  const invoices = existing.QueryResponse?.Invoice || [];
  if (invoices.length > 1) throw new Error("Multiple QuickBooks invoices use this invoice number. Review them before retrying sync.");
  if (invoices[0]) return String(invoices[0].Id);

  // Validate the tax setup before creating a customer or invoice.
  const taxCodeId = await salesTaxCode(input.gstRate);
  const customerId = input.customerId || await findOrCreateCustomer(input.customerName, input.customerEmail, input.customerPhone);
  await input.onCustomerResolved?.(customerId);
  const serviceItemId = process.env.QBO_SERVICE_ITEM_ID || "1";
  const grossCents = input.items.map(item => Math.round(item.amount * 100));
  const grossTotal = grossCents.reduce((sum, amount) => sum + amount, 0);
  const netTotal = Math.round(grossTotal / (1 + input.gstRate / 100));
  let allocatedNet = 0;
  const lines = input.items.map((item, index) => {
    // Allocate rounding on the final line so subtotal + GST equals the app total.
    const net = index === input.items.length - 1 ? netTotal - allocatedNet : Math.round(grossCents[index] / (1 + input.gstRate / 100));
    allocatedNet += net;
    return {
      LineNum: index + 1, Description: item.description, Amount: net / 100,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: serviceItemId }, Qty: 1, UnitPrice: net / 100,
        TaxCodeRef: { value: taxCodeId }, TaxInclusiveAmt: grossCents[index] / 100,
      },
    };
  });
  const result = await qboPost("invoice", {
    DocNumber: input.invoiceNumber, CustomerRef: { value: customerId },
    DueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    Line: lines, GlobalTaxCalculation: "TaxInclusive",
    TxnTaxDetail: { TotalTax: (grossTotal - netTotal) / 100 },
    ...(input.customerEmail ? { BillEmail: { Address: input.customerEmail } } : {}),
  }, requestId("invoice", input.invoiceNumber));
  return String(result.Invoice.Id);
}

export interface QboStatus {
  configured: boolean;
  connected: boolean;
  /** The exact callback URL to register at developer.intuit.com. */
  redirectUri: string;
  /** "sandbox" when using Development keys, "production" for live keys. */
  environment: "sandbox" | "production";
  connectedAt?: string;
  realmId?: string;
  refreshExpiresAt?: number;
  reconnectRequired?: boolean;
  connectionError?: string;
}

export async function getQboStatus(requestOrigin?: string): Promise<QboStatus> {
  const redirectUri = getQboRedirectUri(requestOrigin);
  const environment = isQboSandbox() ? ("sandbox" as const) : ("production" as const);
  const configured = isQboConfigured();
  if (!configured) return { configured: false, connected: false, redirectUri, environment };
  try {
    const doc = await getTokenDoc();
    if (!doc) return { configured: true, connected: false, redirectUri, environment };
    if (tokenNeedsReconnect(doc)) throw new QboReconnectError("QuickBooks authorisation has expired. Reconnect your account.");
    // A saved token alone cannot prove the company is still authorised.
    await qboGet(`companyinfo/${encodeURIComponent(doc.realmId)}`);
    return { configured: true, connected: true, redirectUri, environment,
      connectedAt: doc.connectedAt, realmId: doc.realmId, refreshExpiresAt: doc.refreshExpiresAt };
  } catch (error) {
    return { configured: true, connected: false, redirectUri, environment,
      reconnectRequired: error instanceof QboReconnectError,
      connectionError: error instanceof QboReconnectError ? error.message : "Could not verify the QuickBooks connection. Try again shortly." };
  }
}

export async function disconnectQbo(): Promise<void> {
  const db = await getDb();
  await db.collection("settings").deleteOne({ _id: "quickbooks" as any });
}
