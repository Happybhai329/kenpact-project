export const getLocalTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toDateInputString = (dateValue) => {
  if (!dateValue) return getLocalTodayString();
  return new Date(dateValue).toISOString().split('T')[0];
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
