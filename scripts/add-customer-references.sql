-- Migration: Add customer references
-- Run this against your PostgreSQL database

-- Create the Reference table
CREATE TABLE IF NOT EXISTS "Reference" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- Add unique index on (tenantId, name)
CREATE UNIQUE INDEX IF NOT EXISTS "Reference_tenantId_name_key" ON "Reference"("tenantId", "name");

-- Add index on tenantId
CREATE INDEX IF NOT EXISTS "Reference_tenantId_idx" ON "Reference"("tenantId");

-- Add FK from Reference to Tenant
ALTER TABLE "Reference"
    ADD CONSTRAINT "Reference_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add referenceId column to Customer
ALTER TABLE "Customer"
    ADD COLUMN IF NOT EXISTS "referenceId" TEXT;

-- Add index on referenceId in Customer
CREATE INDEX IF NOT EXISTS "Customer_referenceId_idx" ON "Customer"("referenceId");

-- Add FK from Customer to Reference (SET NULL on delete so deleting a reference doesn't delete customers)
ALTER TABLE "Customer"
    ADD CONSTRAINT "Customer_referenceId_fkey"
    FOREIGN KEY ("referenceId") REFERENCES "Reference"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
