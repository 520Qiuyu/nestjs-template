/*
  Warnings:

  - You are about to alter the column `status` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `gender` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `status` ENUM('normal', 'disabled', 'deleted') NOT NULL DEFAULT 'normal';

-- AlterTable
ALTER TABLE `UserProfile` MODIFY `gender` ENUM('male', 'female', 'unknown') NULL DEFAULT 'unknown';
