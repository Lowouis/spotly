-- Align historical MySQL migrations with the current Prisma schema.

ALTER TABLE `pickable`
    ADD COLUMN `distinguishedName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `cgu` TEXT NULL;

UPDATE `pickable`
SET `cgu` = ''
WHERE `cgu` IS NULL;

ALTER TABLE `pickable`
    MODIFY `cgu` TEXT NOT NULL;

ALTER TABLE `entry`
    ADD COLUMN `system` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `recurringGroupId` INTEGER NULL DEFAULT 0;

ALTER TABLE `LdapConfig`
    ADD COLUMN `adminDn` TEXT NULL,
    ADD COLUMN `emailDomain` VARCHAR(191) NULL;

UPDATE `LdapConfig`
SET `adminDn` = `bindDn`
WHERE `adminDn` IS NULL;

ALTER TABLE `LdapConfig`
    MODIFY `adminDn` TEXT NOT NULL;

ALTER TABLE `timeScheduleOptions`
    ADD COLUMN `authorizedDelay` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `KerberosConfig` (
    `id` VARCHAR(191) NOT NULL,
    `realm` TEXT NOT NULL,
    `kdc` TEXT NOT NULL,
    `adminServer` TEXT NOT NULL,
    `defaultDomain` TEXT NOT NULL,
    `serviceHost` TEXT NOT NULL,
    `keytabPath` TEXT NOT NULL,
    `lastUpdated` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SmtpConfig` (
    `id` VARCHAR(191) NOT NULL,
    `host` TEXT NOT NULL,
    `port` TEXT NOT NULL,
    `username` TEXT NOT NULL,
    `password` TEXT NOT NULL,
    `fromEmail` TEXT NOT NULL,
    `fromName` TEXT NOT NULL,
    `secure` BOOLEAN NOT NULL DEFAULT true,
    `lastUpdated` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
