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
      // Sample schedules are seeded for the week of 2026-04-27 in Asia/Seoul.
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
        location: '합정',
        startAt: new Date('2026-04-30T19:00:00+09:00'),
        endAt: new Date('2026-04-30T21:00:00+09:00'),
        source: ScheduleSource.DB
      },
      {
        personId: byunghyun.id,
        title: '지인 모임',
        description: '주말 모임',
        location: '성수',
        startAt: new Date('2026-05-03T19:00:00+09:00'),
        endAt: new Date('2026-05-03T21:00:00+09:00'),
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
      },
      {
        personId: onyu.id,
        title: '미술학원',
        description: '주간 미술 수업',
        location: '미술학원',
        startAt: new Date('2026-05-01T15:00:00+09:00'),
        endAt: new Date('2026-05-01T16:00:00+09:00'),
        source: ScheduleSource.DB
      },
      {
        personId: onyu.id,
        title: '축구',
        description: '주말 체육 활동',
        location: '근처 운동장',
        startAt: new Date('2026-05-02T10:00:00+09:00'),
        endAt: new Date('2026-05-02T11:00:00+09:00'),
        source: ScheduleSource.DB
      },
      {
        personId: onyu.id,
        title: '가족식당 외식',
        description: '주말 가족 외식',
        location: '가족식당',
        startAt: new Date('2026-05-03T11:00:00+09:00'),
        endAt: new Date('2026-05-03T12:30:00+09:00'),
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
