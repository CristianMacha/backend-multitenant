-- AlterTable: users — platform-level super admin flag (cross-tenant, global bypass)
ALTER TABLE "users" ADD COLUMN "is_platform_admin" BOOLEAN NOT NULL DEFAULT false;
