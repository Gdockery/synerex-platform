/**
 * Shared formatting helpers used across ECBS Intelligence Platform components.
 * Import individual functions directly — no service injection needed.
 */

/**
 * Format a dollar amount compactly: $1.23M, $456K, or $789.
 * Handles null/undefined/NaN gracefully.
 */
export function fmtCurrency(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'K';
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/**
 * Format a kVA or kW value compactly: 1.2M, 456K, or 789.
 */
export function fmtKva(n: number | null | undefined, unit = 'kVA'): string {
  if (n == null || isNaN(n)) return '0 ' + unit;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M ' + unit;
  if (n >= 1_000)     return Math.round(n / 1_000) + 'K ' + unit;
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' ' + unit;
}

/**
 * Format a percentage with a fixed number of decimal places.
 */
export function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null || isNaN(n)) return '—';
  return n.toFixed(decimals) + '%';
}

/**
 * Format a year-fraction as "X.X yrs".
 */
export function fmtYears(n: number | null | undefined): string {
  if (n == null || isNaN(n) || n <= 0) return '—';
  return n.toFixed(1) + ' yrs';
}
