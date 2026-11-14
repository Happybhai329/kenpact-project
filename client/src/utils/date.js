export const getLocalTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toDateInputString = (dateValue) => {
  if (!dateValue) return getLocalTodayString();
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 10);
  }
  const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(dateObj.getTime())) return getLocalTodayString();
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const shiftDays = (dateStr, delta) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return getLocalTodayString();
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toDateInputString(dt);
};

export const shiftMonths = (dateStr, delta) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return getLocalTodayString();
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return toDateInputString(dt);
};

export const formatReadingDate = (
  dateValue,
  options = { day: 'numeric', month: 'short', year: 'numeric' }
) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN', {
    ...options,
    timeZone: 'UTC',
  });
};
