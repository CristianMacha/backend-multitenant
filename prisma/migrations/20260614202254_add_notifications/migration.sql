-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('ACTIVITY_REMINDER', 'SYSTEM', 'GENERIC');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL DEFAULT 'GENERIC',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_read_idx" ON "notifications"("tenant_id", "user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_created_at_idx" ON "notifications"("tenant_id", "user_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
