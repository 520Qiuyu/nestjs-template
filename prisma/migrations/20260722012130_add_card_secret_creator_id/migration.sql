-- AlterTable
ALTER TABLE `CardSecret` ADD COLUMN `creatorId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `CardSecret_creatorId_idx` ON `CardSecret`(`creatorId`);
