-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Event" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "calculator" TEXT NOT NULL DEFAULT 'return 0',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Display" (
    "eventcode" TEXT NOT NULL,
    "itemcode" TEXT NOT NULL,

    CONSTRAINT "Display_pkey" PRIMARY KEY ("eventcode","itemcode")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,
    "eventcode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "receipt_id" TEXT NOT NULL,
    "eventcode" TEXT NOT NULL,
    "itemcode" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "dedication" BOOLEAN NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("receipt_id","index")
);

-- CreateIndex
CREATE INDEX "Display_eventcode_idx" ON "Display"("eventcode");

-- CreateIndex
CREATE INDEX "Display_itemcode_idx" ON "Display"("itemcode");

-- CreateIndex
CREATE INDEX "Receipt_eventcode_idx" ON "Receipt"("eventcode");

-- CreateIndex
CREATE INDEX "Receipt_userId_idx" ON "Receipt"("userId");

-- CreateIndex
CREATE INDEX "Record_receipt_id_idx" ON "Record"("receipt_id");

-- CreateIndex
CREATE INDEX "Record_eventcode_idx" ON "Record"("eventcode");

-- CreateIndex
CREATE INDEX "Record_itemcode_idx" ON "Record"("itemcode");

-- CreateIndex
CREATE INDEX "Record_eventcode_itemcode_idx" ON "Record"("eventcode", "itemcode");

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_eventcode_fkey" FOREIGN KEY ("eventcode") REFERENCES "Event"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_itemcode_fkey" FOREIGN KEY ("itemcode") REFERENCES "Item"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_eventcode_fkey" FOREIGN KEY ("eventcode") REFERENCES "Event"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_eventcode_itemcode_fkey" FOREIGN KEY ("eventcode", "itemcode") REFERENCES "Display"("eventcode", "itemcode") ON DELETE RESTRICT ON UPDATE CASCADE;
