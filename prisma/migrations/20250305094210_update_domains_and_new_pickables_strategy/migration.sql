/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `userId` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `userId` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `VerificationRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `VerificationRequest` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_userId_fkey`;

-- AlterTable
ALTER TABLE `Account` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `userId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Session` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `userId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    ADD COLUMN `external` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER',
    ADD COLUMN `surname` VARCHAR(191) NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `VerificationRequest` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `category`
(
    `id`          INTEGER      NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    `ownerId`     INTEGER NULL,
    `pickableId`  INTEGER NULL,

    INDEX         `category_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain`
(
    `id`         INTEGER      NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(191) NOT NULL,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`  DATETIME(3) NOT NULL,
    `ownerId`    INTEGER NULL,
    `pickableId` INTEGER      NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource`
(
    `id`          INTEGER      NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `moderate`    BOOLEAN      NOT NULL,
    `domainId`    INTEGER      NOT NULL,
    `categoryId`  INTEGER      NOT NULL,
    `status`      ENUM('ACCEPTED', 'AVAILABLE', 'USED', 'REJECTED', 'LOCKED', 'ENDED', 'WAITING') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    `ownerId`     INTEGER NULL,
    `pickableId`  INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pickable`
(
    `id`          INTEGER      NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option`
(
    `id`         INTEGER      NOT NULL AUTO_INCREMENT,
    `tag`        VARCHAR(191) NOT NULL,
    `resourceId` INTEGER      NOT NULL,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`  DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entry`
(
    `id`                        INTEGER NOT NULL AUTO_INCREMENT,
    `resourceId`                INTEGER NOT NULL,
    `userId`                    INTEGER NOT NULL,
    `comment`                   VARCHAR(191) NULL,
    `moderate`                  ENUM('ACCEPTED', 'AVAILABLE', 'USED', 'REJECTED', 'LOCKED', 'ENDED', 'WAITING') NOT NULL DEFAULT 'ACCEPTED',
    `lastUpdatedModerateStatus` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminNote`                 VARCHAR(191) NULL,
    `startDate`                 DATETIME(3) NOT NULL,
    `endDate`                   DATETIME(3) NOT NULL,
    `createdAt`                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `returned`                  BOOLEAN NOT NULL DEFAULT false,
    `returnedConfirmationCode`  VARCHAR(191) NULL,
    `updatedAt`                 DATETIME(3) NOT NULL,

    UNIQUE INDEX `entry_returnedConfirmationCode_key`(`returnedConfirmationCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authorizedLocation`
(
    `id`        INTEGER      NOT NULL AUTO_INCREMENT,
    `libelle`   VARCHAR(191) NOT NULL,
    `ip`        VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `authorizedLocation_ip_key`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account`
    ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session`
    ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category`
    ADD CONSTRAINT `category_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category`
    ADD CONSTRAINT `category_pickableId_fkey` FOREIGN KEY (`pickableId`) REFERENCES `pickable` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domain`
    ADD CONSTRAINT `domain_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domain`
    ADD CONSTRAINT `domain_pickableId_fkey` FOREIGN KEY (`pickableId`) REFERENCES `pickable` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource`
    ADD CONSTRAINT `resource_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource`
    ADD CONSTRAINT `resource_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domain` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource`
    ADD CONSTRAINT `resource_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource`
    ADD CONSTRAINT `resource_pickableId_fkey` FOREIGN KEY (`pickableId`) REFERENCES `pickable` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option`
    ADD CONSTRAINT `option_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resource` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entry`
    ADD CONSTRAINT `entry_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resource` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entry`
    ADD CONSTRAINT `entry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
