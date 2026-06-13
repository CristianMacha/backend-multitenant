import { PrismaClient } from '@prisma/client';
import { Perm } from '@shared/authorization/permissions';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: Perm.users.create, module: 'users', description: 'Create users' },
  { code: Perm.users.read, module: 'users', description: 'Read users' },
  { code: Perm.users.update, module: 'users', description: 'Update users' },
  { code: Perm.users.delete, module: 'users', description: 'Delete users' },
  { code: Perm.roles.create, module: 'roles', description: 'Create roles' },
  { code: Perm.roles.read, module: 'roles', description: 'Read roles' },
  { code: Perm.roles.update, module: 'roles', description: 'Update roles' },
  { code: Perm.roles.delete, module: 'roles', description: 'Delete roles' },
  {
    code: Perm.permissions.read,
    module: 'permissions',
    description: 'Read permissions',
  },
  {
    code: Perm.tenants.create,
    module: 'tenants',
    description: 'Create tenants',
  },
  { code: Perm.tenants.read, module: 'tenants', description: 'Read tenants' },
  {
    code: Perm.tenants.update,
    module: 'tenants',
    description: 'Update tenants',
  },
  {
    code: Perm.tenants.delete,
    module: 'tenants',
    description: 'Delete tenants',
  },
  {
    code: Perm.auditLogs.read,
    module: 'audit-logs',
    description: 'Read audit logs',
  },
];

// Per-tenant system roles. SUPER_ADMIN is intentionally absent: platform
// super admins are global operators flagged on the user account
// (User.isPlatformAdmin), never a per-tenant role. ADMIN is the tenant owner
// and gets every tenant-scoped permission except tenant management.
//
// CRM role mapping (applied from Phase 1 on, see docs/crm-implementation-plan.md):
// the three system roles double as the CRM roles — ADMIN keeps all CRM
// permissions, MANAGER becomes the "Sales Manager" (read everything, manage
// pipelines, read/update/reassign all opportunities, read dashboard) and USER
// becomes the "Sales Agent" (CRUD on their own accounts/contacts/activities,
// manage opportunities they own, read their own dashboard). CRM permission
// codes are reserved in @shared/authorization/permissions.ts and added to
// PERMISSIONS / the role sets below as each module lands.
const SYSTEM_ROLES: Record<string, string[]> = {
  ADMIN: PERMISSIONS.filter((p) => !p.code.startsWith('tenants.')).map(
    (p) => p.code,
  ),
  MANAGER: [
    Perm.users.read,
    Perm.users.update,
    Perm.roles.read,
    Perm.permissions.read,
    Perm.auditLogs.read,
  ],
  USER: [Perm.users.read],
};

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: { name: 'Default Tenant', slug: 'default' },
  });

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        description: permission.description,
        module: permission.module,
      },
      create: permission,
    });
  }

  for (const [roleName, permissionCodes] of Object.entries(SYSTEM_ROLES)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
      update: {},
      create: { tenantId: tenant.id, name: roleName, isSystem: true },
    });

    for (const code of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log(
    'Seed completed: default tenant, permissions and system roles created.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
