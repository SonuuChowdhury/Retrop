// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format amount as Indian Rupees.
 * formatCurrency(299) → "₹299.00"
 */
export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toFixed(2)}`;

/**
 * Format a date string in Indian locale.
 */
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/**
 * Capitalise first letter of every word.
 */
export const toTitleCase = (str = '') =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

/**
 * Returns minutes remaining until a given ISO date string.
 * Returns 0 if already expired.
 */
export const minutesUntil = (isoDate) => {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 60_000));
};
