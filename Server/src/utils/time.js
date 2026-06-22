// ============================================================================
// IST TIME UTILITY
// ============================================================================
// All timestamps stored in DB are in IST (UTC+5:30).
// Use these helpers everywhere instead of new Date().toISOString()

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns current IST time as an ISO string with +05:30 offset.
 * Use this for all DB writes (createdAt, updatedAt, lastLogIn, etc.)
 */
export const nowIST = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  // Format as IST ISO string
  return istTime.toISOString().replace('Z', '+05:30');
};

/**
 * Returns the start of today in IST as an ISO string.
 * e.g. "2025-05-25T00:00:00+05:30"
 */
export const todayStartIST = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const y = istNow.getUTCFullYear();
  const m = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00+05:30`;
};

/**
 * Returns the start of tomorrow in IST as an ISO string.
 */
export const tomorrowStartIST = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  istNow.setUTCDate(istNow.getUTCDate() + 1);
  const y = istNow.getUTCFullYear();
  const m = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00+05:30`;
};

/**
 * Returns IST date string "YYYY-MM-DD" for today.
 */
export const todayDateIST = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const y = istNow.getUTCFullYear();
  const m = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns start of N days ago in IST as an ISO string.
 */
export const daysAgoStartIST = (days) => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  istNow.setUTCDate(istNow.getUTCDate() - days);
  const y = istNow.getUTCFullYear();
  const m = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00+05:30`;
};

/**
 * Returns start and end of a given month in IST.
 * monthOffset: 0 = current month, 1 = last month, etc.
 */
export const monthRangeIST = (monthOffset = 0) => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  istNow.setUTCMonth(istNow.getUTCMonth() - monthOffset);

  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth(); // 0-indexed

  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month + 1, 1)); // exclusive start of next month

  const fmt = (d) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}T00:00:00+05:30`;
  };

  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;

  return {
    start: fmt(startDate),
    end: fmt(endDate), // use .lt(end) — not .lte
    monthLabel,
  };
};