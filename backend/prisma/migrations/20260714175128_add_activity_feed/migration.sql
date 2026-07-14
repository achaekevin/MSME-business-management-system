/*
  Warnings:

  - You are about to drop the column `keyPrefix` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `scopes` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `attempt` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `statusCode` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `success` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `lastTriggeredAt` on the `webhooks` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permissions` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `webhook_deliveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `webhooks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `webhooks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `audit_logs_entity_entityId_idx` ON `audit_logs`;

-- AlterTable
ALTER TABLE `api_keys` DROP COLUMN `keyPrefix`,
    DROP COLUMN `revokedAt`,
    DROP COLUMN `scopes`,
    ADD COLUMN `createdBy` VARCHAR(191) NOT NULL,
    ADD COLUMN `ipWhitelist` JSON NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `permissions` JSON NOT NULL,
    ADD COLUMN `rateLimit` INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `usageCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `audit_logs` DROP COLUMN `entity`,
    DROP COLUMN `entityId`,
    ADD COLUMN `changes` TEXT NULL,
    ADD COLUMN `resource` VARCHAR(191) NOT NULL,
    ADD COLUMN `resourceId` VARCHAR(191) NULL,
    ADD COLUMN `severity` VARCHAR(191) NOT NULL DEFAULT 'info',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    MODIFY `metadata` TEXT NULL;

-- AlterTable
ALTER TABLE `webhook_deliveries` DROP COLUMN `attempt`,
    DROP COLUMN `statusCode`,
    DROP COLUMN `success`,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `errorMessage` TEXT NULL,
    ADD COLUMN `responseBody` TEXT NULL,
    ADD COLUMN `responseCode` INTEGER NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `webhooks` DROP COLUMN `lastTriggeredAt`,
    ADD COLUMN `createdBy` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_businessId_idx`(`businessId`),
    INDEX `activity_logs_businessId_createdAt_idx`(`businessId`, `createdAt`),
    INDEX `activity_logs_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `api_keys_keyHash_idx` ON `api_keys`(`keyHash`);

-- CreateIndex
CREATE INDEX `audit_logs_resource_resourceId_idx` ON `audit_logs`(`resource`, `resourceId`);

-- CreateIndex
CREATE INDEX `audit_logs_severity_idx` ON `audit_logs`(`severity`);

-- CreateIndex
CREATE INDEX `audit_logs_createdAt_idx` ON `audit_logs`(`createdAt`);

-- CreateIndex
CREATE INDEX `webhook_deliveries_status_idx` ON `webhook_deliveries`(`status`);

-- CreateIndex
CREATE INDEX `webhook_deliveries_createdAt_idx` ON `webhook_deliveries`(`createdAt`);

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `audit_logs` RENAME INDEX `audit_logs_userId_fkey` TO `audit_logs_userId_idx`;
