CREATE TABLE `appSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `showFooter` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `appSettings` (`showFooter`, `updatedAt`) VALUES (true, CURRENT_TIMESTAMP(3));
