-- CreateTable
CREATE TABLE `pos_shifts` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `shiftNumber` VARCHAR(191) NOT NULL,
    `openingCash` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `closingCash` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `expectedCash` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cashDifference` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalSales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cashSales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cardSales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `mobileMoneySales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `transactionCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,
    `closingNotes` TEXT NULL,

    INDEX `pos_shifts_businessId_idx`(`businessId`),
    INDEX `pos_shifts_userId_status_idx`(`userId`, `status`),
    UNIQUE INDEX `pos_shifts_businessId_shiftNumber_key`(`businessId`, `shiftNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NOT NULL,
    `saleOrderId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `cashReceived` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `changeGiven` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pos_transactions_shiftId_idx`(`shiftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `receiptHeader` TEXT NULL,
    `receiptFooter` TEXT NULL,
    `autoOpenCashDrawer` BOOLEAN NOT NULL DEFAULT true,
    `autoPrintReceipt` BOOLEAN NOT NULL DEFAULT true,
    `allowNegativeStock` BOOLEAN NOT NULL DEFAULT false,
    `requireCustomer` BOOLEAN NOT NULL DEFAULT false,
    `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_configurations_businessId_branchId_key`(`businessId`, `branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pos_shifts` ADD CONSTRAINT `pos_shifts_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_shifts` ADD CONSTRAINT `pos_shifts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_shifts` ADD CONSTRAINT `pos_shifts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_transactions` ADD CONSTRAINT `pos_transactions_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_transactions` ADD CONSTRAINT `pos_transactions_saleOrderId_fkey` FOREIGN KEY (`saleOrderId`) REFERENCES `sale_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_configurations` ADD CONSTRAINT `pos_configurations_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_configurations` ADD CONSTRAINT `pos_configurations_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
