require('dotenv').config();
const app = require('./app');
const { prisma, pool } = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const start = async () => {
  const server = app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );

  try {
    await prisma.$connect();
    // Warm up the pool so first user queries don't suffer connection/TLS latency
    await pool.query('SELECT 1');
    console.log('✅ Database connected and connection pool warmed');
  } catch (err) {
    console.error('⚠️ Database connection warning on boot:', err.message);
  }

  const shutdown = async () => {
    server.close(async () => {
      try {
        await prisma.$disconnect();
        await pool.end();
      } catch {}
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
