/*
  Warnings:

  - You are about to drop the column `userInfo` on the `AuthInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `AuthInfo` DROP COLUMN `userInfo`,
    ADD COLUMN `platform` VARCHAR(191) NOT NULL DEFAULT 'netease';
