/*
  Warnings:

  - Added the required column `dedication` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Record" (
    "receipt_id" TEXT NOT NULL,
    "eventcode" TEXT NOT NULL,
    "itemcode" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "dedication" BOOLEAN NOT NULL,

    PRIMARY KEY ("receipt_id", "index"),
    CONSTRAINT "Record_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "Receipt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_eventcode_itemcode_fkey" FOREIGN KEY ("eventcode", "itemcode") REFERENCES "Display" ("eventcode", "itemcode") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Record" ("count", "eventcode", "index", "itemcode", "receipt_id") SELECT "count", "eventcode", "index", "itemcode", "receipt_id" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
