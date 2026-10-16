/** Extract GST from inclusive prices without changing or rounding stored amounts. */
export function quoteUnitPriceExGst(price: number | undefined, mode: string | undefined, rate = 10): number {
  const amount = Number(price || 0);
  return mode === "inclusive" ? amount / (1 + rate / 100) : amount;
}
