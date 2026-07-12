-- AlterTable
ALTER TABLE `business_settings` ADD COLUMN `accentColor` VARCHAR(191) NULL,
    ADD COLUMN `brandColor` VARCHAR(191) NULL,
    ADD COLUMN `businessHours` JSON NULL,
    ADD COLUMN `customCss` TEXT NULL,
    ADD COLUMN `fontFamily` VARCHAR(191) NULL,
    ADD COLUMN `multiTaxEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `taxLabel` VARCHAR(191) NULL DEFAULT 'VAT',
    ADD COLUMN `taxRegions` JSON NULL,
    ADD COLUMN `timezone` VARCHAR(191) NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE `holidays` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `recurring` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `holidays_businessId_idx`(`businessId`),
    INDEX `holidays_businessId_date_idx`(`businessId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
