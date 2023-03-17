-- CreateTable
CREATE TABLE "Invite" (
    "email" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "User" (
    "sub" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT
);

-- CreateTable
CREATE TABLE "Item" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "picture" TEXT
);

-- CreateTable
CREATE TABLE "Event" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "calculator" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Display" (
    "eventcode" TEXT NOT NULL,
    "itemcode" TEXT NOT NULL,

    PRIMARY KEY ("eventcode", "itemcode"),
    CONSTRAINT "Display_eventcode_fkey" FOREIGN KEY ("eventcode") REFERENCES "Event" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Display_itemcode_fkey" FOREIGN KEY ("itemcode") REFERENCES "Item" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL,
    "total" INTEGER NOT NULL,
    "eventcode" TEXT NOT NULL,
    "usersub" TEXT NOT NULL,
    CONSTRAINT "Receipt_eventcode_fkey" FOREIGN KEY ("eventcode") REFERENCES "Event" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_usersub_fkey" FOREIGN KEY ("usersub") REFERENCES "User" ("sub") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Record" (
    "receipt_id" TEXT NOT NULL,
    "eventcode" TEXT NOT NULL,
    "itemcode" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,

    PRIMARY KEY ("receipt_id", "index"),
    CONSTRAINT "Record_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "Receipt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_eventcode_itemcode_fkey" FOREIGN KEY ("eventcode", "itemcode") REFERENCES "Display" ("eventcode", "itemcode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
