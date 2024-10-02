/*
  Warnings:

  - You are about to drop the column `address` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "address",
DROP COLUMN "state",
ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "province" TEXT;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "name",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "last_name" TEXT;

-- CreateTable
CREATE TABLE "shopifyDataSyncLog" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopifyDataSyncLog_pkey" PRIMARY KEY ("id")
);
