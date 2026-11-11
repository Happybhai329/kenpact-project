const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// Configure test environment before loading app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_sweety';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DATABASE_URL = 'postgresql://localhost:5432/sweety_test';

// In-memory store mocking Prisma models for deterministic API tests
const store = {
  users: [],
  readings: [],
  nextUserId: 1,
  nextReadingId: 1,
};

const resetStore = () => {
  store.users = [];
  store.readings = [];
  store.nextUserId = 1;
  store.nextReadingId = 1;
};

const toIsoDate = (d) => new Date(d).toISOString().split('T')[0];

const mockPrisma = {
  user: {
    findUnique: async ({ where }) => {
      if (where.email) {
        return store.users.find((u) => u.email === where.email) || null;
      }
      if (where.id) {
        return store.users.find((u) => u.id === where.id) || null;
      }
      return null;
    },
    create: async ({ data }) => {
      const user = {
        id: store.nextUserId++,
        ...data,
        createdAt: new Date(),
      };
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
        if (where.date && toIsoDate(r.date) !== toIsoDate(where.date)) {
          return false;
        }
        return true;
      }).length;
    },
    findFirst: async ({ where }) => {
      return (
        store.readings.find((r) => {
          if (where.id !== undefined && r.id !== where.id) return false;
          if (where.userId !== undefined && r.userId !== where.userId) return false;
          if (where.date !== undefined && toIsoDate(r.date) !== toIsoDate(where.date)) {
            return false;
          }
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
      const reading = {
        id: store.nextReadingId++,
        ...data,
        createdAt: new Date(),
      };
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

// Inject mock prisma module before requiring app
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
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });
  return res;
};

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('Auth: register, duplicate email, login, and protected access', async () => {
  resetStore();

  // Unauthenticated access blocked
  const unauthRes = await request(app).get('/api/readings');
  assert.equal(unauthRes.status, 401);

  // Register user
  const regRes = await registerUser('Happy Patient', 'happy@example.com');
  assert.equal(regRes.status, 201);
  assert.ok(regRes.body.data.token);
  assert.equal(regRes.body.data.user.email, 'happy@example.com');
  assert.equal(regRes.body.data.user.password, undefined);

  // Duplicate email rejected
  const dupRes = await registerUser('Happy Patient', 'HAPPY@example.com');
  assert.equal(dupRes.status, 409);

  // Wrong password rejected
  const badLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'happy@example.com', password: 'wrong' });
  assert.equal(badLogin.status, 401);

  // Valid login succeeds
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'happy@example.com', password: 'password123' });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.data.token);
});

test('Readings validation rules enforce all 5 assignment constraints', async () => {
  resetStore();
  const regRes = await registerUser('Tester', 'tester@example.com');
  const token = regRes.body.data.token;
  const today = getTodayDateString();

  // 1. Value is required
  const missingVal = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: '' });
  assert.equal(missingVal.status, 400);
  assert.equal(missingVal.body.message, 'Please enter a glucose value.');

  // 2a. Value < 40
  const lowVal = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: 39 });
  assert.equal(lowVal.status, 400);
  assert.equal(
    lowVal.body.message,
    'Value must be between 40 and 600 mg/dl.'
  );

  // 2b. Value > 600
  const highVal = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: 601 });
  assert.equal(highVal.status, 400);
  assert.equal(
    highVal.body.message,
    'Value must be between 40 and 600 mg/dl.'
  );

  // 2c. Non-integer value
  const decimalVal = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: 105.5 });
  assert.equal(decimalVal.status, 400);
  assert.equal(
    decimalVal.body.message,
    'Value must be between 40 and 600 mg/dl.'
  );

  // 5. Future date rejected
  const future = new Date();
  future.setDate(future.getDate() + 2);
  const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  const futureRes = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: futureStr, slot: 'morning_fasting', value: 95 });
  assert.equal(futureRes.status, 400);
  assert.equal(futureRes.body.message, 'Date cannot be in the future.');

  // Add valid reading for after_lunch
  const createRes = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'after_lunch', value: 145 });
  assert.equal(createRes.status, 201);

  // 3. Duplicate slot on same date rejected with exact message
  const dupSlotRes = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'after_lunch', value: 150 });
  assert.equal(dupSlotRes.status, 400);
  assert.equal(
    dupSlotRes.body.message,
    'You already have an After lunch reading for this date.'
  );

  // Add remaining 3 slots
  for (const slot of ['morning_fasting', 'after_breakfast', 'after_dinner']) {
    const r = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, slot, value: 110 });
    assert.equal(r.status, 201);
  }

  // 4. 5th reading on same day rejected
  const maxRes = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: today, slot: 'morning_fasting', value: 100 });
  assert.equal(maxRes.status, 400);
  assert.equal(maxRes.body.message, 'You can add only 4 readings per day.');
});

test('Readings CRUD & user isolation', async () => {
  resetStore();
  const userA = (await registerUser('User A', 'a@example.com')).body.data;
  const userB = (await registerUser('User B', 'b@example.com')).body.data;
  const today = getTodayDateString();

  const created = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${userA.token}`)
    .send({ date: today, slot: 'morning_fasting', value: 98 });
  assert.equal(created.status, 201);
  const readingId = created.body.data.id;

  // User B cannot see User A's readings
  const listB = await request(app)
    .get('/api/readings')
    .set('Authorization', `Bearer ${userB.token}`);
  assert.equal(listB.status, 200);
  assert.equal(listB.body.data.total, 0);

  // User B cannot edit or delete User A's reading
  const editB = await request(app)
    .put(`/api/readings/${readingId}`)
    .set('Authorization', `Bearer ${userB.token}`)
    .send({ value: 120 });
  assert.equal(editB.status, 404);

  const delB = await request(app)
    .delete(`/api/readings/${readingId}`)
    .set('Authorization', `Bearer ${userB.token}`);
  assert.equal(delB.status, 404);

  // User A can update and delete
  const editA = await request(app)
    .put(`/api/readings/${readingId}`)
    .set('Authorization', `Bearer ${userA.token}`)
    .send({ value: 102 });
  assert.equal(editA.status, 200);
  assert.equal(editA.body.data.value, 102);

  const delA = await request(app)
    .delete(`/api/readings/${readingId}`)
    .set('Authorization', `Bearer ${userA.token}`);
  assert.equal(delA.status, 200);
});

test('Reports compute daily, month-to-date, and previous month aggregates', async () => {
  resetStore();
  const { token } = (await registerUser('Reporter', 'rep@example.com')).body
    .data;

  // Seed Oct 2026 (previous month for 2026-10-15? Wait: for 2026-10-15, prev month is Sep 2026!)
  // Seed Sep 2026: 100, 140
  for (const [date, slot, value] of [
    ['2026-09-05', 'morning_fasting', 100],
    ['2026-09-20', 'after_lunch', 140],
    // Oct 1 - Oct 15 2026
    ['2026-10-01', 'morning_fasting', 90],
    ['2026-10-15', 'morning_fasting', 95],
    ['2026-10-15', 'after_lunch', 156],
    // Oct 16 2026 (after selected date 15 Oct 2026, should NOT be in MTD for 2026-10-15)
    ['2026-10-16', 'morning_fasting', 210],
  ]) {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date, slot, value });
    assert.equal(res.status, 201);
  }

  // Daily for 2026-10-15: 95, 156 -> avg 125.5
  const dailyRes = await request(app)
    .get('/api/reports/daily?date=2026-10-15')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(dailyRes.status, 200);
  assert.equal(dailyRes.body.data.count, 2);
  assert.equal(dailyRes.body.data.min, 95);
  assert.equal(dailyRes.body.data.max, 156);
  assert.equal(dailyRes.body.data.avg, 125.5);

  // Month-to-date for 2026-10-15: 90, 95, 156 -> avg 113.7
  const mtdRes = await request(app)
    .get('/api/reports/month-to-date?date=2026-10-15')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(mtdRes.status, 200);
  assert.equal(mtdRes.body.data.count, 3);
  assert.equal(mtdRes.body.data.min, 90);
  assert.equal(mtdRes.body.data.max, 156);
  assert.equal(mtdRes.body.data.avg, 113.7);

  // Monthly (whole previous month = Sep 2026): 100, 140 -> avg 120
  const monthlyRes = await request(app)
    .get('/api/reports/monthly?date=2026-10-15')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(monthlyRes.status, 200);
  assert.equal(monthlyRes.body.data.count, 2);
  assert.equal(monthlyRes.body.data.min, 100);
  assert.equal(monthlyRes.body.data.max, 140);
  assert.equal(monthlyRes.body.data.avg, 120);

  // Empty period returns count 0 and null stats
  const emptyRes = await request(app)
    .get('/api/reports/daily?date=2026-08-01')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(emptyRes.status, 200);
  assert.equal(emptyRes.body.data.count, 0);
  assert.equal(emptyRes.body.data.avg, null);
});
