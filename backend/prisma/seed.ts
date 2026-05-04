import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient, ScheduleSource } from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

async function main() {
  await prisma.schedule.deleteMany();
  await prisma.person.deleteMany();

  const [piljae, byunghyun, onyu] = await Promise.all([
    prisma.person.create({
      data: {
        name: '필재',
        slug: 'piljae',
        color: '#335CFF'
      }
    }),
    prisma.person.create({
      data: {
        name: '병현',
        slug: 'byunghyun',
        color: '#35A854'
      }
    }),
    prisma.person.create({
      data: {
        name: '온유',
        slug: 'onyu',
        color: '#FF8A3D'
      }
    })
  ]);

  await prisma.schedule.createMany({
    data: [
      {
        personId: byunghyun.id,
        title: '헬스',
        description: '주간 운동 루틴',
        location: '동네 헬스장',
        startAt: new Date('2026-04-29T13:00:00+09:00'),
        endAt: new Date('2026-04-29T14:00:00+09:00'),
        source: ScheduleSource.DB
      },
      {
        personId: byunghyun.id,
        title: '저녁 약속',
        description: '친구와 저녁 식사',
        location: '송정',
        startAt: new Date('2026-04-30T19:00:00+09:00'),
        endAt: new Date('2026-04-30T21:00:00+09:00'),
        source: ScheduleSource.DB
      },
      {
        personId: onyu.id,
        title: '동화책 읽기',
        description: '잠들기 전 독서 시간',
        location: '집',
        startAt: new Date('2026-04-29T19:30:00+09:00'),
        endAt: new Date('2026-04-29T20:00:00+09:00'),
        source: ScheduleSource.DB
      }
    ]
  });

  console.info(`Seed completed for ${piljae.name}, ${byunghyun.name}, ${onyu.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
