require('dotenv').config();
const app = require('./app');
const { prisma, pool } = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    const server = app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );

    const shutdown = async () => {
      server.close(async () => {
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Failed to connect to database', err);
    process.exit(1);
  }
};

start();
