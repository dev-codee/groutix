/** Resolve one explicit recipient; older callers can still use the customer email. */
export function conversationRecipient(input: unknown, customerEmail?: string): string {
  const value = input === undefined ? customerEmail : input;
  if (typeof value !== "string") throw new Error("Enter a recipient email address.");
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) {
    throw new Error("Enter one valid recipient email address.");
  }
  return email;
}
