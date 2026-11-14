require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma, pool } = require('./src/config/prisma');
const { parseDateOnlyUTC } = require('./src/utils/dateUtils');

const SLOTS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
];

function randomGlucoseForSlot(slot) {
  switch (slot) {
    case 'morning_fasting':
      return Math.floor(Math.random() * (120 - 82 + 1)) + 82;
    case 'after_breakfast':
      return Math.floor(Math.random() * (175 - 115 + 1)) + 115;
    case 'after_lunch':
      return Math.floor(Math.random() * (190 - 120 + 1)) + 120;
    case 'after_dinner':
      return Math.floor(Math.random() * (180 - 110 + 1)) + 110;
    default:
      return 110;
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.reading.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Demo Patient',
      email: 'demo@sweety.com',
      password: hashedPassword,
    },
  });
  console.log('✅ Created demo user: demo@sweety.com / demo1234');

  const readings = [];
  const today = new Date();

  // Seed 45 days up to today so Daily, Month-to-Date, and Previous Month reports all have rich data
  for (let d = 44; d >= 0; d--) {
    const dt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - d
    );
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const parsedDate = parseDateOnlyUTC(dateStr);

    // Leave 1 slot open today so the reviewer can immediately test adding a reading
    const selectedSlots =
      d === 0
        ? ['morning_fasting', 'after_breakfast', 'after_lunch']
        : SLOTS.slice(0, Math.floor(Math.random() * 2) + 3);

    for (const slot of selectedSlots) {
      readings.push({
        userId: user.id,
        date: parsedDate,
        slot,
        value: randomGlucoseForSlot(slot),
      });
    }
  }

  await prisma.reading.createMany({ data: readings });
  console.log(`✅ Created ${readings.length} readings across 45 days`);
  console.log('🎉 Seed complete!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
