-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logIntegrityHash" TEXT;
