/*
  Warnings:

  - A unique constraint covering the columns `[transactionType,currency]` on the table `fees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "fees_transactionType_currency_key" ON "fees"("transactionType", "currency");
