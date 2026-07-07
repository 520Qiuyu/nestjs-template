/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `PermissionResource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `PermissionRole` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,resourceId,isDeleted]` on the table `PermissionRoleResource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,roleId,isDeleted]` on the table `PermissionUserRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `PermissionResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `PermissionRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PermissionResource` ADD COLUMN `code` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `PermissionRole` ADD COLUMN `code` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'normal';

-- CreateIndex
CREATE UNIQUE INDEX `PermissionResource_code_key` ON `PermissionResource`(`code`);

-- CreateIndex
CREATE INDEX `PermissionResource_parentId_idx` ON `PermissionResource`(`parentId`);

-- CreateIndex
CREATE INDEX `PermissionResource_url_method_idx` ON `PermissionResource`(`url`, `method`);

-- CreateIndex
CREATE UNIQUE INDEX `PermissionRole_code_key` ON `PermissionRole`(`code`);

-- CreateIndex
CREATE INDEX `PermissionRole_status_idx` ON `PermissionRole`(`status`);

-- CreateIndex
CREATE INDEX `PermissionRoleResource_roleId_idx` ON `PermissionRoleResource`(`roleId`);

-- CreateIndex
CREATE INDEX `PermissionRoleResource_resourceId_idx` ON `PermissionRoleResource`(`resourceId`);

-- CreateIndex
CREATE UNIQUE INDEX `PermissionRoleResource_roleId_resourceId_isDeleted_key` ON `PermissionRoleResource`(`roleId`, `resourceId`, `isDeleted`);

-- CreateIndex
CREATE INDEX `PermissionUserRole_userId_idx` ON `PermissionUserRole`(`userId`);

-- CreateIndex
CREATE INDEX `PermissionUserRole_roleId_idx` ON `PermissionUserRole`(`roleId`);

-- CreateIndex
CREATE UNIQUE INDEX `PermissionUserRole_userId_roleId_isDeleted_key` ON `PermissionUserRole`(`userId`, `roleId`, `isDeleted`);
