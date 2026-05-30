-- Vendors + Purchases + Plan purchase linkage

CREATE TABLE IF NOT EXISTS "Vendor" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_tenantId_phone_key" ON "Vendor"("tenantId", "phone");
CREATE INDEX IF NOT EXISTS "Vendor_tenantId_idx" ON "Vendor"("tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Vendor_tenantId_fkey'
  ) THEN
    ALTER TABLE "Vendor"
      ADD CONSTRAINT "Vendor_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Purchase" (
  "id" SERIAL NOT NULL,
  "vendorId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "tenantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "consumedQty" INTEGER NOT NULL DEFAULT 0,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "purchasedAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Purchase_tenantId_idx" ON "Purchase"("tenantId");
CREATE INDEX IF NOT EXISTS "Purchase_vendorId_idx" ON "Purchase"("vendorId");
CREATE INDEX IF NOT EXISTS "Purchase_itemId_idx" ON "Purchase"("itemId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_tenantId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_vendorId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_itemId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "Item"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "InstallmentPlan"
  ADD COLUMN IF NOT EXISTS "purchaseId" INTEGER;

CREATE INDEX IF NOT EXISTS "InstallmentPlan_purchaseId_idx" ON "InstallmentPlan"("purchaseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InstallmentPlan_purchaseId_fkey'
  ) THEN
    ALTER TABLE "InstallmentPlan"
      ADD CONSTRAINT "InstallmentPlan_purchaseId_fkey"
      FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
