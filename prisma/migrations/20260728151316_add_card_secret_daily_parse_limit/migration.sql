-- AlterTable
ALTER TABLE `CardSecret` ADD COLUMN `dailyParseDate` DATETIME(3) NULL,
    ADD COLUMN `dailyParseLimit` INTEGER NULL,
    ADD COLUMN `dailyParsedCount` INTEGER NOT NULL DEFAULT 0;
