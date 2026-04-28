-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organizerId" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "startDatetime" TEXT NOT NULL,
    "endDatetime" TEXT NOT NULL,
    "attendeeCount" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TYPE user_status AS ENUM ('going', 'waitlisted', 'cancelled');

CREATE TABLE "RSVP" {
    "userId" TEXT NOT NULL,
    "eventID" TEXT NOT NULL,
    "status" user_status,
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAT" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
}
