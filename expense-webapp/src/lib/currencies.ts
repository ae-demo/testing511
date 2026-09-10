// ISO 4217 currency codes are a fixed reference list, not data the API owns —
// expense-api's contract carries currency codes on expenses/totals but has no
// "list currencies" operation, so the entry form offers this common set.
export const CURRENCY_CODES = ["USD", "EUR", "GBP", "AUD", "CAD", "JPY", "INR", "SGD"] as const;
