-- AlterTable
ALTER TABLE `roles` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `displayName` VARCHAR(191) NULL,
    ADD COLUMN `isCustom` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isEnabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `roles_businessId_isEnabled_idx` ON `roles`(`businessId`, `isEnabled`);
