-- CreateTable
CREATE TABLE `IpBlacklist` (
    `id` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `expireAt` DATETIME(3) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `unblockedAt` DATETIME(3) NULL,
    `unblockedBy` VARCHAR(191) NULL,
    `ctime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `utime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `IpBlacklist_ip_idx`(`ip`),
    INDEX `IpBlacklist_status_idx`(`status`),
    INDEX `IpBlacklist_ctime_idx`(`ctime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
