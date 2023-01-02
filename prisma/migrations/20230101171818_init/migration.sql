/*
  Warnings:

  - You are about to drop the column `serviceType` on the `fees` table. All the data in the column will be lost.
  - The `currency` column on the `wallets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `transactionType` to the `fees` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `phone` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "fees" DROP COLUMN "serviceType",
ADD COLUMN     "transactionType" "TransactionType" NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';
