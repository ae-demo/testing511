/** Formats a monetary amount with 2 decimals — matches the wireframe's "42.50" style. */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/** "2026-09-10" -> "Sep 10", matching the wireframe's date column style. */
export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** yyyy-mm-dd for a date input's value, defaulting to today. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
