-- CreateTable
CREATE TABLE `cash_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `balance` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `openingDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closingDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cash_accounts_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `cashAccountId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `payee` VARCHAR(191) NULL,
    `receiptNumber` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cash_transactions_cashAccountId_idx`(`cashAccountId`),
    INDEX `cash_transactions_transactionDate_idx`(`transactionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_rates` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `taxType` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isCompound` BOOLEAN NOT NULL DEFAULT false,
    `applicableOn` VARCHAR(191) NOT NULL DEFAULT 'sale',
    `region` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tax_rates_businessId_idx`(`businessId`),
    INDEX `tax_rates_businessId_isActive_idx`(`businessId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_components` (
    `id` VARCHAR(191) NOT NULL,
    `taxRateId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_exemptions` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `taxRateId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `exemptionType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tax_exemptions_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_payments` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `taxRateId` VARCHAR(191) NULL,
    `paymentNumber` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `taxableAmount` DECIMAL(14, 2) NOT NULL,
    `taxAmount` DECIMAL(14, 2) NOT NULL,
    `penalty` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `interest` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(14, 2) NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tax_payments_businessId_idx`(`businessId`),
    INDEX `tax_payments_status_idx`(`status`),
    UNIQUE INDEX `tax_payments_businessId_paymentNumber_key`(`businessId`, `paymentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fixed_assets` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `assetNumber` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `purchasePrice` DECIMAL(14, 2) NOT NULL,
    `residualValue` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `usefulLife` INTEGER NOT NULL,
    `depreciationMethod` VARCHAR(191) NOT NULL DEFAULT 'straight_line',
    `depreciationPeriod` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `accumulatedDepr` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `currentValue` DECIMAL(14, 2) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `depreciationAcctId` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `serialNumber` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NULL,
    `warrantyExpiry` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `disposalDate` DATETIME(3) NULL,
    `disposalValue` DECIMAL(14, 2) NULL,
    `disposalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fixed_assets_businessId_idx`(`businessId`),
    INDEX `fixed_assets_businessId_status_idx`(`businessId`, `status`),
    UNIQUE INDEX `fixed_assets_businessId_assetNumber_key`(`businessId`, `assetNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `depreciation_entries` (
    `id` VARCHAR(191) NOT NULL,
    `fixedAssetId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `openingValue` DECIMAL(14, 2) NOT NULL,
    `depreciationAmount` DECIMAL(14, 2) NOT NULL,
    `accumulatedDepr` DECIMAL(14, 2) NOT NULL,
    `closingValue` DECIMAL(14, 2) NOT NULL,
    `journalEntryId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'calculated',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `depreciation_entries_fixedAssetId_idx`(`fixedAssetId`),
    INDEX `depreciation_entries_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `budgetType` VARCHAR(191) NOT NULL,
    `fiscalYear` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `totalBudget` DECIMAL(14, 2) NOT NULL,
    `totalActual` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `variance` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budgets_businessId_idx`(`businessId`),
    INDEX `budgets_businessId_fiscalYear_idx`(`businessId`, `fiscalYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_items` (
    `id` VARCHAR(191) NOT NULL,
    `budgetId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `subcategory` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `budgetedAmount` DECIMAL(14, 2) NOT NULL,
    `actualAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `variance` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `variancePct` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `period` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budget_items_budgetId_idx`(`budgetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `income_categories` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `income_categories_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `income_records` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `incomeNumber` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NULL,
    `cashAccountId` VARCHAR(191) NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `receiptNumber` VARCHAR(191) NULL,
    `incomeDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer` VARCHAR(191) NULL,
    `taxAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `attachments` JSON NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `income_records_businessId_idx`(`businessId`),
    INDEX `income_records_incomeDate_idx`(`incomeDate`),
    UNIQUE INDEX `income_records_businessId_incomeNumber_key`(`businessId`, `incomeNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expense_categories_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_records` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `expenseNumber` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NULL,
    `cashAccountId` VARCHAR(191) NULL,
    `vendor` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `expenseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `paymentDate` DATETIME(3) NULL,
    `taxAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `taxDeductible` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `attachments` JSON NULL,
    `recurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringPattern` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expense_records_businessId_idx`(`businessId`),
    INDEX `expense_records_expenseDate_idx`(`expenseDate`),
    INDEX `expense_records_status_idx`(`status`),
    UNIQUE INDEX `expense_records_businessId_expenseNumber_key`(`businessId`, `expenseNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_reconciliations` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NULL,
    `cashAccountId` VARCHAR(191) NULL,
    `statementDate` DATETIME(3) NOT NULL,
    `openingBalance` DECIMAL(14, 2) NOT NULL,
    `closingBalance` DECIMAL(14, 2) NOT NULL,
    `systemBalance` DECIMAL(14, 2) NOT NULL,
    `difference` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reconciledBy` VARCHAR(191) NULL,
    `reconciledAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_reconciliations_businessId_idx`(`businessId`),
    INDEX `payment_reconciliations_statementDate_idx`(`statementDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_reconciliation_items` (
    `id` VARCHAR(191) NOT NULL,
    `reconciliationId` VARCHAR(191) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `debit` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `credit` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `isReconciled` BOOLEAN NOT NULL DEFAULT false,
    `systemMatchId` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `payment_reconciliation_items_reconciliationId_idx`(`reconciliationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `snapshotType` VARCHAR(191) NOT NULL,
    `periodType` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `fiscalYear` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `totalAssets` DECIMAL(14, 2) NULL,
    `totalLiabilities` DECIMAL(14, 2) NULL,
    `totalEquity` DECIMAL(14, 2) NULL,
    `totalRevenue` DECIMAL(14, 2) NULL,
    `totalExpenses` DECIMAL(14, 2) NULL,
    `netProfit` DECIMAL(14, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `financial_snapshots_businessId_idx`(`businessId`),
    INDEX `financial_snapshots_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    UNIQUE INDEX `financial_snapshots_businessId_snapshotType_periodStart_peri_key`(`businessId`, `snapshotType`, `periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cash_accounts` ADD CONSTRAINT `cash_accounts_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_cashAccountId_fkey` FOREIGN KEY (`cashAccountId`) REFERENCES `cash_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_rates` ADD CONSTRAINT `tax_rates_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_components` ADD CONSTRAINT `tax_components_taxRateId_fkey` FOREIGN KEY (`taxRateId`) REFERENCES `tax_rates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_exemptions` ADD CONSTRAINT `tax_exemptions_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_exemptions` ADD CONSTRAINT `tax_exemptions_taxRateId_fkey` FOREIGN KEY (`taxRateId`) REFERENCES `tax_rates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_payments` ADD CONSTRAINT `tax_payments_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_payments` ADD CONSTRAINT `tax_payments_taxRateId_fkey` FOREIGN KEY (`taxRateId`) REFERENCES `tax_rates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fixed_assets` ADD CONSTRAINT `fixed_assets_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `depreciation_entries` ADD CONSTRAINT `depreciation_entries_fixedAssetId_fkey` FOREIGN KEY (`fixedAssetId`) REFERENCES `fixed_assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_items` ADD CONSTRAINT `budget_items_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_categories` ADD CONSTRAINT `income_categories_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_records` ADD CONSTRAINT `income_records_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_records` ADD CONSTRAINT `income_records_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `income_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_records` ADD CONSTRAINT `expense_records_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_records` ADD CONSTRAINT `expense_records_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_reconciliations` ADD CONSTRAINT `payment_reconciliations_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_reconciliation_items` ADD CONSTRAINT `payment_reconciliation_items_reconciliationId_fkey` FOREIGN KEY (`reconciliationId`) REFERENCES `payment_reconciliations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_snapshots` ADD CONSTRAINT `financial_snapshots_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
