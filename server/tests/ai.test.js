const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_ai';
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
    findUnique: async ({ where }) => store.users.find((u) => u.email === where.email || u.id === where.id) || null,
    create: async ({ data }) => {
      const user = { id: store.nextUserId++, ...data, createdAt: new Date() };
      store.users.push(user);
      return user;
    },
  },
  reading: {
    findMany: async ({ where }) => {
      return store.readings.filter((r) => {
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
    },
    count: async () => store.readings.length,
    findFirst: async () => null,
    create: async ({ data }) => {
      const reading = { id: store.nextReadingId++, ...data, createdAt: new Date() };
      store.readings.push(reading);
      return reading;
    },
    update: async () => ({}),
    delete: async () => {},
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

test('AI: unauthenticated request to /api/ai/insights returns 401', async () => {
  const res = await request(app).get('/api/ai/insights');
  assert.equal(res.status, 401);
});

test('AI: generates clinical insights for patient readings', async () => {
  resetStore();
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'AI Patient', email: 'ai@example.com', password: 'password123' });
  const token = reg.body.data.token;
  const today = getTodayDateString();

  // Add 4 readings
  for (const [slot, value] of [
    ['morning_fasting', 92],
    ['after_breakfast', 135],
    ['after_lunch', 142],
    ['after_dinner', 118],
  ]) {
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, slot, value });
  }

  const res = await request(app)
    .get(`/api/ai/insights?type=daily&date=${today}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'success');
  const insights = res.body.data;
  assert.ok(insights.status);
  assert.ok(insights.summary);
  assert.ok(Array.isArray(insights.patterns));
  assert.ok(Array.isArray(insights.recommendations));
  assert.ok(Array.isArray(insights.doctorQuestions));
  assert.ok(insights.disclaimer);
});

test('AI: handles empty readings period gracefully', async () => {
  resetStore();
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Empty AI', email: 'empty@example.com', password: 'password123' });
  const token = reg.body.data.token;

  const res = await request(app)
    .get('/api/ai/insights?type=daily&date=2025-01-01')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'No Data');
  assert.ok(res.body.data.summary.includes('No blood glucose readings'));
});
