/**
 * Quantities come out of the MRP spreadsheet as raw floats, so a per-unit
 * usage of 10.616 arrives as 10.616000000000001. Round off that noise and
 * drop trailing zeros so the UI shows "10.616", not the full expansion.
 */
export function formatQty(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Number(value.toFixed(4));
  return String(rounded);
}
