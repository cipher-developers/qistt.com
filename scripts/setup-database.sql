-- Create schema for Kistly SaaS
-- PostgreSQL migration script

-- Create enum for UserRole
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- Create Tenant table
CREATE TABLE "Tenant" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create User table
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'MANAGER',
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create indexes for User
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_email_idx" ON "User"(email);

-- Create Customer table
CREATE TABLE "Customer" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", phone),
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create indexes for Customer
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- Create Category table
CREATE TABLE "Category" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", name),
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create indexes for Category
CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");

-- Create Item table
CREATE TABLE "Item" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "categoryId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("categoryId") REFERENCES "Category"(id) ON DELETE CASCADE,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create indexes for Item
CREATE INDEX "Item_tenantId_idx" ON "Item"("tenantId");
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- Create InstallmentPlan table
CREATE TABLE "InstallmentPlan" (
  id TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sellingPrice" DOUBLE PRECISION NOT NULL,
  "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monthlyAmount" DOUBLE PRECISION NOT NULL,
  months INT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE CASCADE,
  FOREIGN KEY ("itemId") REFERENCES "Item"(id) ON DELETE CASCADE,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create indexes for InstallmentPlan
CREATE INDEX "InstallmentPlan_tenantId_idx" ON "InstallmentPlan"("tenantId");
CREATE INDEX "InstallmentPlan_customerId_idx" ON "InstallmentPlan"("customerId");
CREATE INDEX "InstallmentPlan_itemId_idx" ON "InstallmentPlan"("itemId");

-- Create Installment table
CREATE TABLE "Installment" (
  id TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "installmentNumber" INT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("planId", "installmentNumber"),
  FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"(id) ON DELETE CASCADE
);

-- Create indexes for Installment
CREATE INDEX "Installment_planId_idx" ON "Installment"("planId");

-- Create Transaction table
CREATE TABLE "Transaction" (
  id TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  description TEXT,
  "transactionDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"(id) ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE CASCADE,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create indexes for Transaction
CREATE INDEX "Transaction_tenantId_idx" ON "Transaction"("tenantId");
CREATE INDEX "Transaction_planId_idx" ON "Transaction"("planId");
CREATE INDEX "Transaction_customerId_idx" ON "Transaction"("customerId");
