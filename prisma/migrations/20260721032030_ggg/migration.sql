-- CreateTable
CREATE TABLE `CardSecret` (
    `id` VARCHAR(191) NOT NULL,
    `secret` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'time',
    `expireTime` DATETIME(3) NULL,
    `parseLimit` INTEGER NOT NULL DEFAULT 0,
    `parsedCount` INTEGER NOT NULL DEFAULT 0,
    `authInfoId` VARCHAR(191) NULL,
    `ctime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `utime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `remark` VARCHAR(191) NULL,

    UNIQUE INDEX `CardSecret_secret_key`(`secret`),
    INDEX `CardSecret_authInfoId_idx`(`authInfoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthInfo` (
    `id` VARCHAR(191) NOT NULL,
    `userInfo` JSON NOT NULL,
    `authInfo` JSON NOT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `ctime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `utime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `remark` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
