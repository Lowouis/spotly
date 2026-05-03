CREATE TABLE IF NOT EXISTS `resourceEventType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resourceEventType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resourceEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resourceId` INTEGER NOT NULL,
    `typeId` INTEGER NULL,
    `reportedById` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `customTypeName` VARCHAR(191) NULL,
    `customTypeIcon` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `severity` VARCHAR(191) NULL,
    `problemDate` DATETIME(3) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `makesResourceUnavailable` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `resourceEvent_resourceId_startDate_idx`(`resourceId`, `startDate`),
    INDEX `resourceEvent_typeId_idx`(`typeId`),
    INDEX `resourceEvent_reportedById_idx`(`reportedById`),
    PRIMARY KEY (`id`),
    CONSTRAINT `resourceEvent_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `resourceEvent_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `resourceEventType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `resourceEvent_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
