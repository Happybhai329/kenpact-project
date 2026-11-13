const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_readings';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DATABASE_URL = 'postgresql://localhost:5432/sweety_test';

const store = { users: [], readings: [], nextUserId: 1, nextReadingId: 1 };
const resetStore = () => {
  store.users = [];
  store.readings = [];
  store.nextUserId = 1;
  store.nextReadingId = 1;
};

const toIsoDate = (d) => new Date(d).toISOString().split('T')[0];

const mockPrisma = {
  user: {
    findUnique: async ({ where, select }) => {
      let user;
      if (where.email) user = store.users.find((u) => u.email === where.email);
      if (where.id) user = store.users.find((u) => u.id === where.id);
      if (!user) return null;
      if (select) {
        const result = {};
        for (const key of Object.keys(select)) {
          if (select[key]) result[key] = user[key];
        }
        return result;
      }
      return user;
    },
    create: async ({ data }) => {
      const user = { id: store.nextUserId++, ...data, createdAt: new Date() };
      store.users.push(user);
      return user;
    },
  },
  reading: {
    findMany: async ({ where, orderBy, skip = 0, take }) => {
      let rows = store.readings.filter((r) => {
        if (where.userId && r.userId !== where.userId) return false;
        if (where.date) {
          const rStr = toIsoDate(r.date);
          if (where.date instanceof Date) {
            if (rStr !== toIsoDate(where.date)) return false;
          } else {
            if (where.date.gte && rStr < toIsoDate(where.date.gte)) return false;
            if (where.date.lte && rStr > toIsoDate(where.date.lte)) return false;
          }
        }
        return true;
      });
      if (Array.isArray(orderBy)) {
        rows = [...rows].sort((a, b) => {
          for (const clause of orderBy) {
            if (clause.date) {
              const cmp = toIsoDate(a.date).localeCompare(toIsoDate(b.date));
              if (cmp !== 0) return clause.date === 'desc' ? -cmp : cmp;
            }
            if (clause.slot) {
              const cmp = a.slot.localeCompare(b.slot);
              if (cmp !== 0) return clause.slot === 'desc' ? -cmp : cmp;
            }
          }
          return 0;
        });
      }
      return typeof take === 'number' ? rows.slice(skip, skip + take) : rows;
    },
    count: async ({ where }) => {
      return store.readings.filter((r) => {
        if (where.userId && r.userId !== where.userId) return false;
        if (where.date && toIsoDate(r.date) !== toIsoDate(where.date)) return false;
        return true;
      }).length;
    },
    findFirst: async ({ where }) => {
      return (
        store.readings.find((r) => {
          if (where.id !== undefined && r.id !== where.id) return false;
          if (where.userId !== undefined && r.userId !== where.userId) return false;
          if (where.date !== undefined && toIsoDate(r.date) !== toIsoDate(where.date)) return false;
          if (where.slot !== undefined && r.slot !== where.slot) return false;
          if (where.NOT?.id !== undefined && r.id === where.NOT.id) return false;
          return true;
        }) || null
      );
    },
    create: async ({ data }) => {
      const exists = store.readings.find(
        (r) =>
          r.userId === data.userId &&
          toIsoDate(r.date) === toIsoDate(data.date) &&
          r.slot === data.slot
      );
      if (exists) {
        const err = new Error('Unique constraint failed');
        err.code = 'P2002';
        throw err;
      }
      const reading = { id: store.nextReadingId++, ...data, createdAt: new Date() };
      store.readings.push(reading);
      return reading;
    },
    update: async ({ where, data }) => {
      const idx = store.readings.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error('Not found');
      store.readings[idx] = { ...store.readings[idx], ...data };
      return store.readings[idx];
    },
    delete: async ({ where }) => {
      const idx = store.readings.findIndex((r) => r.id === where.id);
      if (idx !== -1) store.readings.splice(idx, 1);
    },
  },
};

const prismaPath = require.resolve('../src/config/prisma');
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: { prisma: mockPrisma, pool: { end: async () => {} } },
};

const app = require('../src/app');
const { getTodayDateString } = require('../src/utils/dateUtils');

const registerUser = async (name, email, password = 'password123') => {
  return request(app).post('/api/auth/register').send({ name, email, password });
};

test('Readings: pagination returns correct page metadata', async () => {
  resetStore();
  const { body } = await registerUser('Pager', 'pager@example.com');
  const token = body.data.token;
  const today = getTodayDateString();

  // Create 4 readings on today
  for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, slot, value: 100 });
  }

  // Request page 1 with limit 2
  const res = await request(app)
    .get('/api/readings?page=1&limit=2')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.readings.length, 2);
  assert.equal(res.body.data.total, 4);
  assert.equal(res.body.data.pages, 2);
  assert.equal(res.body.data.page, 1);

  // Request page 2
  const res2 = await request(app)
    .get('/api/readings?page=2&limit=2')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res2.body.data.readings.length, 2);
  assert.equal(res2.body.data.page, 2);
});

test('Readings: boundary values 40 and 600 are accepted', async () => {
  resetStore();
  const { body } = await registerUser('Bounds', 'bounds@example.com');
  const token = body.data.token;
  const today = getTodayDateString();

  const low = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: 40 });
  assert.equal(low.status, 201);
  assert.equal(low.body.data.value, 40);

  const high = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'after_dinner', value: 600 });
  assert.equal(high.status, 201);
  assert.equal(high.body.data.value, 600);
});

test('Readings: invalid slot rejected', async () => {
  resetStore();
  const { body } = await registerUser('Slotter', 'slotter@example.com');
  const token = body.data.token;

  const res = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: getTodayDateString(), slot: 'midnight_snack', value: 100 });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Please select a valid time slot.');
});

test('Readings: invalid date format rejected', async () => {
  resetStore();
  const { body } = await registerUser('Dater', 'dater@example.com');
  const token = body.data.token;

  const res = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '13-11-2026', slot: 'morning_fasting', value: 100 });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Please select a valid date.');
});

test('Readings: date filter returns only that date', async () => {
  resetStore();
  const { body } = await registerUser('Filterer', 'filterer@example.com');
  const token = body.data.token;
  const today = getTodayDateString();

  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: 95 });

  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-01-01', slot: 'morning_fasting', value: 100 });

  const res = await request(app)
    .get(`/api/readings?date=${today}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.total, 1);
  assert.equal(res.body.data.readings[0].value, 95);
});

test('Readings: negative value rejected', async () => {
  resetStore();
  const { body } = await registerUser('Neg', 'neg@example.com');
  const token = body.data.token;

  const res = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: getTodayDateString(), slot: 'morning_fasting', value: -10 });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Value must be between 40 and 600 mg/dl.');
});

test('Readings: string value "abc" rejected', async () => {
  resetStore();
  const { body } = await registerUser('Stringer', 'stringer@example.com');
  const token = body.data.token;

  const res = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: getTodayDateString(), slot: 'morning_fasting', value: 'abc' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Value must be between 40 and 600 mg/dl.');
});

test('Readings: invalid reading ID returns 400', async () => {
  resetStore();
  const { body } = await registerUser('BadID', 'badid@example.com');
  const token = body.data.token;

  const res = await request(app)
    .put('/api/readings/abc')
    .set('Authorization', `Bearer ${token}`)
    .send({ value: 100 });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Invalid reading ID.');
});
