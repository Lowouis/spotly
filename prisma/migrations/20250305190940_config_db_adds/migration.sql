-- CreateTable
CREATE TABLE `LdapConfig`
(
    `id`            VARCHAR(191) NOT NULL,
    `serverUrl`     TEXT         NOT NULL,
    `bindDn`        TEXT         NOT NULL,
    `adminCn`       TEXT         NOT NULL,
    `adminPassword` TEXT         NOT NULL,
    `lastUpdated`   DATETIME(3) NOT NULL,
    `updatedBy`     VARCHAR(191) NOT NULL,
    `isActive`      BOOLEAN      NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
