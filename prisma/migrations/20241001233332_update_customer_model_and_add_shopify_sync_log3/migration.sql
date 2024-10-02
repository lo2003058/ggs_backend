/*
  Warnings:

  - Made the column `first_name` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;
