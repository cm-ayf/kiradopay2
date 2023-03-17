/*
  Warnings:

  - Made the column `picture` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usersub" TEXT NOT NULL,
    "until" DATETIME NOT NULL,
    CONSTRAINT "Session_usersub_fkey" FOREIGN KEY ("usersub") REFERENCES "User" ("sub") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "picture" TEXT NOT NULL
);
INSERT INTO "new_Item" ("code", "name", "picture") SELECT "code", "name", "picture" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_Event" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "calculator" TEXT NOT NULL DEFAULT 'return 0'
);
INSERT INTO "new_Event" ("calculator", "code", "date", "name") SELECT "calculator", "code", "date", "name" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
