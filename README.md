# MSME Business Management System

## Project Overview

The MSME Business Management System is a multi-tenant enterprise resource planning (ERP), point-of-sale (POS), and financial accounting platform built for Micro, Small, and Medium Enterprises. It provides unified operational workflows across multi-branch retail, wholesale, warehousing, procurement, sales, double-entry accounting, human resources, and customer relationship management.

---

## Features Implemented in the System

### Multi-Tenancy and Branch Management
- Isolated multi-tenant architecture with tenant-level data separation.
- Support for multiple branches and warehouse facilities per business.
- Configurable business profiles, regional settings, and localized currencies.

### Role-Based Access Control (RBAC) and Security
- 10 primary system roles: Super Administrator, Business Owner, Branch Manager, Operations Manager, Accountant, Sales Manager, Cashier / POS Operator, Inventory Officer, Procurement Officer, and HR Manager.
- Granular permission matrix with over 145 discrete permission nodes.
- JWT authentication with secure refresh token rotation and session management.
- Account lockout policies, IP restrictions, and full audit logging.

### Point of Sale (POS) and Sales Management
- Cashier shift lifecycle management (opening float, till reconciliations, cash movements, closing counts).
- Barcode scanning, customizable receipt headers/footers, and instant checkout.
- Quotations, sales orders, automated invoice generation, and credit notes.
- Flexible payment method processing (Cash, Card, Mobile Money / M-Pesa, Bank Transfer).

### Catalog, Inventory, and Warehouse Operations
- Multi-tier product categories, units of measure, product variants, and SKU/barcode mapping.
- Real-time stock tracking across multiple warehouses, bins, and branch locations.
- Stock adjustments, inter-warehouse transfers, low-stock threshold alerts, and inventory ledger history.

### Procurement and Supplier Management
- Supplier directory, payment terms, and vendor ledger balances.
- Full procurement pipeline: Purchase Requests, Purchase Orders, and Goods Received Notes (GRN).
- Supplier invoice tracking and accounts payable reconciliation.

### Customer Relationship Management (CRM)
- Customer profiles, customer grouping, credit limits, and outstanding ledger balances.
- Customer transaction history, loyalty points tracking, and statements.

### Financial and Double-Entry Accounting
- Standardized Chart of Accounts across Assets, Liabilities, Equity, Income, and Expenses.
- Real-time balanced double-entry journal vouchers with strict debit-credit validation.
- General ledger, income/expense tracking, budget monitoring, and fixed asset depreciation schedules.
- Multi-rate tax management, VAT configurations, and tax payment logging.

### Human Resources and Payroll
- Organizational structure with departments, positions, and employee profiles.
- Shift schedules, attendance logging, and automated leave request/balance tracking.
- Payroll generation with customizable salary components, allowances, and statutory deductions.
- Performance review cycles, KPIs, and employee document repositories.

### Auditing and System Utilities
- Centralized audit trail capturing actor, entity, action, IP address, and change diffs.
- Real-time event notifications via WebSockets.
- File and attachment storage management.

---

## Technology Stack

### Frontend
- **Core Framework**: React 18
- **Build Tool**: Vite
- **Languages**: JavaScript, TypeScript
- **UI & Styling**: Tailwind CSS, Radix UI Primitives, Lucide Icons, Framer Motion
- **State Management & Data Fetching**: TanStack React Query v5, Zustand
- **Form Management & Validation**: React Hook Form, Zod
- **Routing**: React Router DOM v6
- **Data Visualization**: Recharts
- **Real-Time Communication**: Socket.io Client
- **Testing**: Playwright (E2E)

### Backend
- **Runtime & Framework**: Node.js, Express.js
- **Database**: MySQL Server 8.0
- **ORM & Data Layer**: Prisma ORM
- **In-Memory Store & Background Jobs**: Redis, BullMQ
- **Authentication & Security**: JWT (JSON Web Tokens), Bcrypt, Helmet, Express Rate Limit, HPP, XSS Clean
- **Real-Time Engine**: Socket.io
- **Validation**: Zod, Express Validator
- **Object Storage**: MinIO / S3 SDK
- **Logging & Monitoring**: Winston (Daily Rotate File), Morgan
- **Testing**: Jest, Supertest

---

## Project Structure

```text
MSME-business-management-system/
├── _frontend/
│   ├── public/                 # Static assets and PWA manifests
│   ├── src/
│   │   ├── assets/             # Images and global stylesheet assets
│   │   ├── components/         # Reusable UI primitives and domain widgets
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Dashboard and authentication layout wrappers
│   │   ├── lib/                # API client instances and helper utilities
│   │   ├── pages/              # Module view pages (POS, Sales, HR, Accounting)
│   │   ├── routes/             # Client-side routing and protected routes
│   │   ├── store/              # Zustand global state stores
│   │   └── types/              # TypeScript declarations
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── docker/                 # Container runtime configurations
│   ├── docs/                   # Architecture diagrams and ERD specifications
│   ├── prisma/
│   │   ├── migrations/         # Database migration history
│   │   ├── schema.prisma       # Relational database schema
│   │   ├── seed.js             # Core permissions and enterprise roles seeder
│   │   ├── seed-finance.js     # Chart of accounts and finance seeder
│   │   ├── seed-hr.js          # HR departments, leave types, and payroll seeder
│   │   └── seed-catalog.js     # Products, stock, customer, and supplier seeder
│   ├── src/
│   │   ├── config/             # Database, Redis, MinIO, and app settings
│   │   ├── constants/          # Role identifiers and permission dictionaries
│   │   ├── middleware/         # Auth, RBAC, tenant isolation, and error handlers
│   │   ├── modules/            # Domain controllers, services, and repositories
│   │   ├── queues/             # BullMQ background job definitions and workers
│   │   ├── routes/             # REST API endpoint definitions
│   │   ├── storage/            # Object storage services
│   │   ├── app.js              # Express application assembly
│   │   └── server.js           # HTTP server and WebSocket bootstrapper
│   ├── tests/
│   │   ├── integration/        # Database and API integration test suites
│   │   └── unit/               # Service and utility unit tests
│   ├── package.json
│   └── docker-compose.yml
│
└── README.md
```
