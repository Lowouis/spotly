CREATE TABLE `resourceUnavailability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resourceId` INTEGER NOT NULL,
    `createdById` INTEGER NULL,
    `type` ENUM('MAINTENANCE', 'ADMIN_BLOCK', 'INTERNAL_USE', 'EVENT', 'INVENTORY', 'OTHER') NOT NULL DEFAULT 'ADMIN_BLOCK',
    `reason` VARCHAR(191) NULL,
    `visibleToUsers` BOOLEAN NOT NULL DEFAULT false,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `recurringGroupId` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `resourceUnavailability_resourceId_startDate_endDate_idx`(`resourceId`, `startDate`, `endDate`),
    INDEX `resourceUnavailability_createdById_idx`(`createdById`),
    INDEX `resourceUnavailability_recurringGroupId_idx`(`recurringGroupId`),
    INDEX `resourceUnavailability_type_startDate_idx`(`type`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resourceUnavailability` ADD CONSTRAINT `resourceUnavailability_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resourceUnavailability` ADD CONSTRAINT `resourceUnavailability_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
