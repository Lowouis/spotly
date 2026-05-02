CREATE INDEX `resource_domainId_categoryId_status_idx` ON `resource`(`domainId`, `categoryId`, `status`);
CREATE INDEX `resource_ownerId_status_idx` ON `resource`(`ownerId`, `status`);
CREATE INDEX `entry_resourceId_startDate_endDate_idx` ON `entry`(`resourceId`, `startDate`, `endDate`);
CREATE INDEX `entry_userId_startDate_idx` ON `entry`(`userId`, `startDate`);
CREATE INDEX `entry_moderate_startDate_idx` ON `entry`(`moderate`, `startDate`);
CREATE INDEX `entry_recurringGroupId_idx` ON `entry`(`recurringGroupId`);
