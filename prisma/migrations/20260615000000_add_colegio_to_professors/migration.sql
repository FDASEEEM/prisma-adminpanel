-- AlterTable: Agregar colegio_id a professors
ALTER TABLE "professors" ADD COLUMN IF NOT EXISTS "colegio_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "professors_colegio_id_idx" ON "professors"("colegio_id");

-- AlterEnum: Agregar acciones de colegio al enum AdminAuditAction
ALTER TYPE "AdminAuditAction" ADD VALUE 'colegio_create';
ALTER TYPE "AdminAuditAction" ADD VALUE 'colegio_update';
ALTER TYPE "AdminAuditAction" ADD VALUE 'colegio_delete';
