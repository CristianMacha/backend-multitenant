/**
 * One-time script: registers the first platform super admin.
 *
 * A platform super admin is a global operator (manages tenants, bypasses
 * role/permission checks, may cross tenants). It is NOT a per-tenant role:
 * it is the `is_platform_admin` flag on the user account. The user still
 * has a home tenant (the seeded `default` tenant) for data ownership.
 *
 * Usage (after `pnpm prisma:seed`):
 *   FIREBASE_UID=<uid> EMAIL=<email> FIRST_NAME=John LAST_NAME=Doe \
 *     npx ts-node -r tsconfig-paths/register scripts/bootstrap-super-admin.ts
 *
 * The Firebase UID must already exist in your Firebase project (create it
 * via the Firebase Console or Admin SDK before running this script).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const firebaseUid = process.env.FIREBASE_UID;
  const email = process.env.EMAIL;
  const firstName = process.env.FIRST_NAME ?? 'Super';
  const lastName = process.env.LAST_NAME ?? 'Admin';

  if (!firebaseUid || !email) {
    console.error(
      'ERROR: FIREBASE_UID and EMAIL environment variables are required.',
    );
    process.exit(1);
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
  if (!tenant) {
    console.error(
      'ERROR: Default tenant not found. Run `pnpm prisma:seed` first.',
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { firebaseUid } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { isPlatformAdmin: true, deletedAt: null, isActive: true },
    });
    console.log(
      `✓ Existing user promoted to platform super admin: ${updated.email} (id: ${updated.id})`,
    );
  } else {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        firebaseUid,
        email: email.trim().toLowerCase(),
        firstName,
        lastName,
        isPlatformAdmin: true,
      },
    });

    console.log(
      `✓ Platform super admin created: ${user.email} (id: ${user.id})`,
    );
  }

  console.log('Done. You can now authenticate with your Firebase token.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
