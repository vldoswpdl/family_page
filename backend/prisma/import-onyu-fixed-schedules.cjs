const path = require('node:path');
const dotenv = require('dotenv');
const { PrismaClient, ScheduleSource } = require('@prisma/client');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

const template = [
  { dow: 0, title: '학교', location: '학교', start: '09:00', end: '13:30' },
  { dow: 0, title: '폴리', location: '폴리', start: '15:30', end: '18:30' },
  { dow: 1, title: '학교', location: '학교', start: '09:00', end: '14:30' },
  { dow: 1, title: '수학의아침', location: '수학의아침', start: '15:10', end: '19:00' },
  { dow: 2, title: '학교', location: '학교', start: '09:00', end: '13:30' },
  { dow: 2, title: '폴리', location: '폴리', start: '15:30', end: '18:30' },
  { dow: 3, title: '학교', location: '학교', start: '09:00', end: '13:30' },
  { dow: 3, title: '수학의아침', location: '수학의아침', start: '15:10', end: '19:00' },
  { dow: 4, title: '학교', location: '학교', start: '09:00', end: '13:30' },
  { dow: 4, title: '폴리', location: '폴리', start: '15:30', end: '18:30' },
  { dow: 5, title: '축구', location: '축구', start: '08:30', end: '10:00' },
  { dow: 5, title: '미술', location: '미술', start: '13:00', end: '15:00' },
  { dow: 6, title: '골프', location: '골프', start: '13:30', end: '14:30' }
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function main() {
  const startMonday = new Date('2026-05-04T00:00:00+09:00');
  const weeks = Number(process.env.ONYU_FIXED_SCHEDULE_WEEKS || '52');
  const onyu = await prisma.person.upsert({
    where: { slug: 'onyu' },
    update: { name: '온유', color: '#FF8A3D' },
    create: { slug: 'onyu', name: '온유', color: '#FF8A3D' }
  });

  let count = 0;

  for (let week = 0; week < weeks; week += 1) {
    for (const item of template) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + week * 7 + item.dow);
      const dateText = ymd(date);
      const externalId = `onyu-fixed-${dateText}-${item.title}`;

      await prisma.schedule.upsert({
        where: { externalId },
        update: {
          title: item.title,
          description: '온유 주간 고정 스케줄',
          location: item.location,
          startAt: new Date(`${dateText}T${item.start}:00+09:00`),
          endAt: new Date(`${dateText}T${item.end}:00+09:00`),
          source: ScheduleSource.DB,
          personId: onyu.id
        },
        create: {
          externalId,
          title: item.title,
          description: '온유 주간 고정 스케줄',
          location: item.location,
          startAt: new Date(`${dateText}T${item.start}:00+09:00`),
          endAt: new Date(`${dateText}T${item.end}:00+09:00`),
          source: ScheduleSource.DB,
          personId: onyu.id
        }
      });

      count += 1;
    }
  }

  console.info(`Upserted ${count} Onyu fixed schedules.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
