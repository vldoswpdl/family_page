-- CreateEnum
CREATE TYPE "ScheduleSource" AS ENUM ('DB', 'GOOGLE_CALENDAR');

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "source" "ScheduleSource" NOT NULL DEFAULT 'DB',
    "externalId" TEXT,
    "personId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_externalId_key" ON "Schedule"("externalId");

-- CreateIndex
CREATE INDEX "Schedule_personId_startAt_idx" ON "Schedule"("personId", "startAt");

-- CreateIndex
CREATE INDEX "Schedule_startAt_endAt_idx" ON "Schedule"("startAt", "endAt");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

