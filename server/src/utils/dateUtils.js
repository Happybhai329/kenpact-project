const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isValidDateString = (dateStr) => {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
};

const parseDateOnlyUTC = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const formatDateOnlyUTC = (dateObj) => {
  return new Date(dateObj).toISOString().split('T')[0];
};

const getMonthStartUTC = (dateStr) => {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};

const getPreviousMonthRangeUTC = (dateStr) => {
  const [y, m] = dateStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 2, 1));
  const end = new Date(Date.UTC(y, m - 1, 0));
  return { start, end };
};

module.exports = {
  getTodayDateString,
  isValidDateString,
  parseDateOnlyUTC,
  formatDateOnlyUTC,
  getMonthStartUTC,
  getPreviousMonthRangeUTC,
};
