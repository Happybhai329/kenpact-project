const SLOT_NAMES = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const getStatus = (value) => {
  if (value < 70) return 'Low';
  if (value <= 140) return 'Normal';
  if (value <= 200) return 'Elevated';
  return 'High';
};

export function exportReadingsToCsv(readings, filename = 'sweety-readings.csv') {
  if (!readings || readings.length === 0) return;

  const headers = ['Date', 'Time Slot', 'Glucose (mg/dl)', 'Status'];
  const rows = readings.map((r) => {
    const dateStr = new Date(r.date).toISOString().split('T')[0];
    const slotStr = SLOT_NAMES[r.slot] || r.slot;
    const val = r.value;
    const status = getStatus(val);
    return [dateStr, `"${slotStr}"`, val, status];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
