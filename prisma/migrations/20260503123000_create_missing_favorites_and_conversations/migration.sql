CREATE TABLE IF NOT EXISTS `favorite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('SITE', 'RESOURCE') NOT NULL,
    `domainId` INTEGER NULL,
    `resourceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `favorite_userId_type_domainId_key`(`userId`, `type`, `domainId`),
    UNIQUE INDEX `favorite_userId_type_resourceId_key`(`userId`, `type`, `resourceId`),
    INDEX `favorite_userId_idx`(`userId`),
    INDEX `favorite_domainId_idx`(`domainId`),
    INDEX `favorite_resourceId_idx`(`resourceId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `favorite_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domain`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `favorite_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contextType` ENUM('ENTRY', 'RESOURCE_EVENT') NOT NULL,
    `contextId` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'ARCHIVED') NOT NULL DEFAULT 'OPEN',
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `conversation_contextType_contextId_key`(`contextType`, `contextId`),
    INDEX `conversation_contextType_status_idx`(`contextType`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversationParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` ENUM('OWNER', 'REPORTER', 'ADMIN', 'PARTICIPANT') NOT NULL DEFAULT 'PARTICIPANT',
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `conversationParticipant_conversationId_userId_key`(`conversationId`, `userId`),
    INDEX `conversationParticipant_userId_readAt_idx`(`userId`, `readAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `conversationParticipant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `conversationParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversationMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `system` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `conversationMessage_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `conversationMessage_userId_idx`(`userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `conversationMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `conversationMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
