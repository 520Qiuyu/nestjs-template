-- AlterTable
ALTER TABLE `CardSecret` ADD COLUMN `enableTime` DATETIME(3) NULL,
    ADD COLUMN `validDays` INTEGER NULL;
