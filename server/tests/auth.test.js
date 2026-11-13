const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_auth';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DATABASE_URL = 'postgresql://localhost:5432/sweety_test';

// In-memory store
const store = { users: [], nextUserId: 1 };
const resetStore = () => {
  store.users = [];
  store.nextUserId = 1;
};

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
    findMany: async () => [],
    count: async () => 0,
    findFirst: async () => null,
    create: async () => ({}),
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

test('Auth: missing name returns validation error', async () => {
  resetStore();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: '', email: 'test@example.com', password: 'password123' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Name is required');
});

test('Auth: invalid email format returns validation error', async () => {
  resetStore();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'not-an-email', password: 'password123' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Valid email is required');
});

test('Auth: short password returns validation error', async () => {
  resetStore();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'test@example.com', password: '123' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Password must be at least 6 characters');
});

test('Auth: login with empty password returns validation error', async () => {
  resetStore();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: '' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Password is required');
});

test('Auth: login with non-existent email returns 401', async () => {
  resetStore();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ghost@example.com', password: 'password123' });
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Invalid email or password');
});

test('Auth: GET /me returns profile for authenticated user', async () => {
  resetStore();
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Profile Test', email: 'profile@example.com', password: 'password123' });
  assert.equal(regRes.status, 201);
  const token = regRes.body.data.token;

  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.data.user.email, 'profile@example.com');
  assert.equal(meRes.body.data.user.name, 'Profile Test');
  // Password must not leak
  assert.equal(meRes.body.data.user.password, undefined);
});

test('Auth: GET /me without token returns 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Not authenticated');
});

test('Auth: invalid JWT returns 401', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer totally.invalid.token');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Invalid or expired token');
});

test('Health check returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('404 route returns proper error', async () => {
  const res = await request(app).get('/api/nonexistent');
  assert.equal(res.status, 404);
  assert.ok(res.body.message.includes('not found'));
});
