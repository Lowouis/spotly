ALTER TABLE `appSettings`
    ADD COLUMN `setupCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `setupCompletedAt` DATETIME(3) NULL,
    ADD COLUMN `setupMode` VARCHAR(191) NULL,
    ADD COLUMN `setupAdminUserId` INTEGER NULL;
