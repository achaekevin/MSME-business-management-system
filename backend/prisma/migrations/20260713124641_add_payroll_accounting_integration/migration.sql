/*
  Warnings:

  - A unique constraint covering the columns `[journalEntryId]` on the table `payroll_periods` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `journal_entries` ADD COLUMN `postedAt` DATETIME(3) NULL,
    ADD COLUMN `postedBy` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `totalCredit` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `totalDebit` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `type` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payroll_periods` ADD COLUMN `accountingStatus` VARCHAR(191) NULL DEFAULT 'pending',
    ADD COLUMN `journalEntryId` VARCHAR(191) NULL,
    ADD COLUMN `postedToAccountingAt` DATETIME(3) NULL,
    ADD COLUMN `postedToAccountingBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payroll_slips` ADD COLUMN `absentDays` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `overtimeAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `journal_entries_status_idx` ON `journal_entries`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `payroll_periods_journalEntryId_key` ON `payroll_periods`(`journalEntryId`);

-- AddForeignKey
ALTER TABLE `payroll_periods` ADD CONSTRAINT `payroll_periods_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
