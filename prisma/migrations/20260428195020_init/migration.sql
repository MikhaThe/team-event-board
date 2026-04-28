/*
  Warnings:

  - You are about to drop the column `createdAT` on the `RSVP` table. All the data in the column will be lost.
  - You are about to drop the column `eventID` on the `RSVP` table. All the data in the column will be lost.
  - Added the required column `eventId` to the `RSVP` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RSVP" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_RSVP" ("id", "status", "userId") SELECT "id", "status", "userId" FROM "RSVP";
DROP TABLE "RSVP";
ALTER TABLE "new_RSVP" RENAME TO "RSVP";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
