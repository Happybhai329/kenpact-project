const { prisma } = require('../../config/prisma');
const AppError = require('../../utils/AppError');
const {
  getTodayDateString,
  isValidDateString,
  parseDateOnlyUTC,
  formatDateOnlyUTC,
  getMonthStartUTC,
  getPreviousMonthRangeUTC,
} = require('../../utils/dateUtils');

const validateReportDate = (dateStr) => {
  const target = dateStr || getTodayDateString();
  if (!isValidDateString(target)) {
    throw new AppError('Please provide a valid date (YYYY-MM-DD).', 400);
  }
  return target;
};

const aggregate = async (userId, type, selectedDate, start, end) => {
  const readings = await prisma.reading.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    orderBy: [{ date: 'asc' }, { slot: 'asc' }],
  });

  const base = {
    type,
    date: selectedDate,
    startDate: formatDateOnlyUTC(start),
    endDate: formatDateOnlyUTC(end),
  };

  if (readings.length === 0) {
    return { ...base, count: 0, min: null, max: null, avg: null, readings };
  }

  const values = readings.map((r) => r.value);
  const sum = values.reduce((acc, v) => acc + v, 0);

  return {
    ...base,
    count: readings.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: parseFloat((sum / values.length).toFixed(1)),
    readings,
  };
};

const daily = async (userId, dateStr) => {
  const selected = validateReportDate(dateStr);
  const target = parseDateOnlyUTC(selected);
  return aggregate(userId, 'daily', selected, target, target);
};

const monthToDate = async (userId, dateStr) => {
  const selected = validateReportDate(dateStr);
  const start = getMonthStartUTC(selected);
  const end = parseDateOnlyUTC(selected);
  return aggregate(userId, 'month-to-date', selected, start, end);
};

const monthly = async (userId, dateStr) => {
  const selected = validateReportDate(dateStr);
  const { start, end } = getPreviousMonthRangeUTC(selected);
  return aggregate(userId, 'monthly', selected, start, end);
};

module.exports = { daily, monthToDate, monthly };
