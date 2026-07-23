-- CreateTable
CREATE TABLE `ParseLog` (
    `id` VARCHAR(191) NOT NULL,
    `cardSecret` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `targetName` VARCHAR(191) NOT NULL DEFAULT '',
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `userAccount` VARCHAR(191) NULL,
    `errorMsg` VARCHAR(191) NULL,
    `parseParams` JSON NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `ctime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `utime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ParseLog_ctime_idx`(`ctime`),
    INDEX `ParseLog_status_idx`(`status`),
    INDEX `ParseLog_type_idx`(`type`),
    INDEX `ParseLog_cardSecret_idx`(`cardSecret`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
