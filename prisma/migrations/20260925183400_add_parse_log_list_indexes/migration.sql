-- CreateIndex
CREATE INDEX `ParseLog_isDeleted_ctime_idx` ON `ParseLog`(`isDeleted`, `ctime`);

-- CreateIndex
CREATE INDEX `ParseLog_isDeleted_status_ctime_idx` ON `ParseLog`(`isDeleted`, `status`, `ctime`);
