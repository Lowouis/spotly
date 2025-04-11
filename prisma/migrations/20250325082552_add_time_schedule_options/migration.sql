/*
  Warnings:

  - The values [AVAILABLE,LOCKED] on the enum `entry_moderate` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACCEPTED,USED,REJECTED,ENDED,WAITING] on the enum `resource_status` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name]` on the table `pickable` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `entry` MODIFY `resourceId` INTEGER NULL,
    MODIFY `moderate` ENUM('ACCEPTED', 'USED', 'REJECTED', 'ENDED', 'WAITING') NOT NULL DEFAULT 'ACCEPTED';

-- AlterTable
ALTER TABLE `resource` MODIFY `status` ENUM('AVAILABLE', 'UNAVAILABLE', 'LOCKED') NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE `timeScheduleOptions`
(
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `onPickup`  INTEGER NOT NULL,
    `onReturn`  INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `pickable_name_key` ON `pickable` (`name`);
