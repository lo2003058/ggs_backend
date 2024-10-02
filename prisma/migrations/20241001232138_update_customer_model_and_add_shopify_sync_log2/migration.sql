/*
  Warnings:

  - You are about to drop the `shopifyDataSyncLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "shopifyDataSyncLog";

-- CreateTable
CREATE TABLE "ShopifyDataSyncLog" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopifyDataSyncLog_pkey" PRIMARY KEY ("id")
);
