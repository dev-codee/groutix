import { signQuoteToken, siteBaseUrl, verifyQuoteToken } from "./quoteToken";

export const initialChecklistRevision = "initial";

function signingKey(id: string, revision: string) {
  return `job-checklist:${id}:${revision}`;
}

export function buildJobChecklistUrl(id: string, revision = initialChecklistRevision): string {
  const params = new URLSearchParams({ revision, token: signQuoteToken(signingKey(id, revision)) });
  return `${siteBaseUrl()}/checklist/${encodeURIComponent(id)}/job?${params}`;
}

export function verifyJobChecklistLink(id: string, revision: string, token: string): boolean {
  return Boolean(revision && token.length === 43 && verifyQuoteToken(signingKey(id, revision), token));
}
