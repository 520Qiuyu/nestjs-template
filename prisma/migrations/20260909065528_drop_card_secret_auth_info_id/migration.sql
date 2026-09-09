/*
  Warnings:

  - You are about to drop the column `authInfoId` on the `CardSecret` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `CardSecret_authInfoId_idx` ON `CardSecret`;

-- AlterTable
ALTER TABLE `CardSecret` DROP COLUMN `authInfoId`;
