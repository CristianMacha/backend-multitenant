-- CreateTable
CREATE TABLE "crm_settings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "default_currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_settings_tenant_id_key" ON "crm_settings"("tenant_id");

-- AddForeignKey
ALTER TABLE "crm_settings" ADD CONSTRAINT "crm_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
