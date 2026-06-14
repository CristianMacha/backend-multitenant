-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'TASK', 'NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "activity_status" AS ENUM ('OPEN', 'DONE');

-- CreateEnum
CREATE TYPE "activity_source" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "related_to_type" AS ENUM ('ACCOUNT', 'CONTACT', 'OPPORTUNITY');

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "activity_type" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" "activity_status" NOT NULL DEFAULT 'OPEN',
    "owner_id" UUID,
    "source" "activity_source" NOT NULL DEFAULT 'USER',
    "related_to_type" "related_to_type" NOT NULL,
    "related_to_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_tenant_id_idx" ON "activities"("tenant_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_owner_id_idx" ON "activities"("tenant_id", "owner_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_related_to_type_related_to_id_idx" ON "activities"("tenant_id", "related_to_type", "related_to_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_status_due_at_idx" ON "activities"("tenant_id", "status", "due_at");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
