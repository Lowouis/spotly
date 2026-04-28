-- CreateTable
CREATE TABLE `EmailNotificationLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateName` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `contextKey` VARCHAR(191) NOT NULL,
    `dateKey` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailNotificationLog_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `EmailNotificationLog_templateName_recipient_contextKey_date_key`(`templateName`, `recipient`, `contextKey`, `dateKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
