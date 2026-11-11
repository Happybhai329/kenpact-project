const { prisma } = require('../../config/prisma');
const AppError = require('../../utils/AppError');
const {
  getTodayDateString,
  isValidDateString,
  parseDateOnlyUTC,
  formatDateOnlyUTC,
} = require('../../utils/dateUtils');

const VALID_SLOTS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
];

const SLOT_PHRASES = {
  morning_fasting: 'a Morning (fasting)',
  after_breakfast: 'an After breakfast',
  after_lunch: 'an After lunch',
  after_dinner: 'an After dinner',
};

const validateReadingFields = ({ date, slot, value }) => {
  if (!date || !isValidDateString(date)) {
    throw new AppError('Please select a valid date.', 400);
  }

  if (date > getTodayDateString()) {
    throw new AppError('Date cannot be in the future.', 400);
  }

  if (!VALID_SLOTS.includes(slot)) {
    throw new AppError('Please select a valid time slot.', 400);
  }

  if (value === undefined || value === null || String(value).trim() === '') {
    throw new AppError('Please enter a glucose value.', 400);
  }

  const trimmed = String(value).trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new AppError('Value must be between 40 and 600 mg/dl.', 400);
  }

  const numValue = Number(trimmed);
  if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
    throw new AppError('Value must be between 40 and 600 mg/dl.', 400);
  }

  return numValue;
};

const parseReadingId = (id) => {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    throw new AppError('Invalid reading ID.', 400);
  }
  return numId;
};

const getAll = async (userId, { page = 1, limit = 20, date } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = { userId };
  if (date) {
    if (!isValidDateString(date)) {
      throw new AppError('Invalid date filter.', 400);
    }
    where.date = parseDateOnlyUTC(date);
  }

  const [readings, total] = await Promise.all([
    prisma.reading.findMany({
      where,
      orderBy: [{ date: 'desc' }, { slot: 'asc' }],
      skip,
      take: safeLimit,
    }),
    prisma.reading.count({ where }),
  ]);

  return {
    readings,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
};

const create = async (userId, { date, slot, value }) => {
  const parsedValue = validateReadingFields({ date, slot, value });
  const targetDate = parseDateOnlyUTC(date);

  const count = await prisma.reading.count({
    where: { userId, date: targetDate },
  });
  if (count >= 4) {
    throw new AppError('You can add only 4 readings per day.', 400);
  }

  const duplicate = await prisma.reading.findFirst({
    where: { userId, date: targetDate, slot },
  });
  if (duplicate) {
    throw new AppError(
      `You already have ${SLOT_PHRASES[slot]} reading for this date.`,
      400
    );
  }

  try {
    return await prisma.reading.create({
      data: {
        userId,
        date: targetDate,
        slot,
        value: parsedValue,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError(
        `You already have ${SLOT_PHRASES[slot]} reading for this date.`,
        400
      );
    }
    throw err;
  }
};

const update = async (userId, id, { date, slot, value }) => {
  const readingId = parseReadingId(id);
  const existing = await prisma.reading.findFirst({
    where: { id: readingId, userId },
  });
  if (!existing) {
    throw new AppError('Reading not found.', 404);
  }

  const existingDateStr = formatDateOnlyUTC(existing.date);
  const targetDateStr = date !== undefined ? date : existingDateStr;
  const targetSlot = slot !== undefined ? slot : existing.slot;
  const targetValue = value !== undefined ? value : existing.value;

  const parsedValue = validateReadingFields({
    date: targetDateStr,
    slot: targetSlot,
    value: targetValue,
  });
  const targetDate = parseDateOnlyUTC(targetDateStr);

  if (targetDateStr !== existingDateStr) {
    const countOnTargetDate = await prisma.reading.count({
      where: { userId, date: targetDate },
    });
    if (countOnTargetDate >= 4) {
      throw new AppError('You can add only 4 readings per day.', 400);
    }
  }

  const duplicate = await prisma.reading.findFirst({
    where: {
      userId,
      date: targetDate,
      slot: targetSlot,
      NOT: { id: readingId },
    },
  });
  if (duplicate) {
    throw new AppError(
      `You already have ${SLOT_PHRASES[targetSlot]} reading for this date.`,
      400
    );
  }

  try {
    return await prisma.reading.update({
      where: { id: readingId },
      data: {
        date: targetDate,
        slot: targetSlot,
        value: parsedValue,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError(
        `You already have ${SLOT_PHRASES[targetSlot]} reading for this date.`,
        400
      );
    }
    throw err;
  }
};

const remove = async (userId, id) => {
  const readingId = parseReadingId(id);
  const reading = await prisma.reading.findFirst({
    where: { id: readingId, userId },
  });
  if (!reading) {
    throw new AppError('Reading not found.', 404);
  }
  await prisma.reading.delete({ where: { id: readingId } });
};

module.exports = { getAll, create, update, remove };
