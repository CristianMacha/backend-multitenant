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
  // --- CRM: accounts (Phase 1) ---
  {
    code: Perm.accounts.create,
    module: 'accounts',
    description: 'Create accounts',
  },
  {
    code: Perm.accounts.read,
    module: 'accounts',
    description: 'Read accounts',
  },
  {
    code: Perm.accounts.update,
    module: 'accounts',
    description: 'Update accounts',
  },
  {
    code: Perm.accounts.delete,
    module: 'accounts',
    description: 'Archive accounts',
  },
  // --- CRM: contacts (Phase 1) ---
  {
    code: Perm.contacts.create,
    module: 'contacts',
    description: 'Create contacts',
  },
  {
    code: Perm.contacts.read,
    module: 'contacts',
    description: 'Read contacts',
  },
  {
    code: Perm.contacts.update,
    module: 'contacts',
    description: 'Update contacts',
  },
  {
    code: Perm.contacts.delete,
    module: 'contacts',
    description: 'Delete contacts',
  },
  // --- Sales: pipelines (Phase 2) ---
  {
    code: Perm.pipelines.create,
    module: 'pipelines',
    description: 'Create pipelines',
  },
  {
    code: Perm.pipelines.read,
    module: 'pipelines',
    description: 'Read pipelines',
  },
  {
    code: Perm.pipelines.update,
    module: 'pipelines',
    description: 'Update pipelines',
  },
  {
    code: Perm.pipelines.delete,
    module: 'pipelines',
    description: 'Delete pipelines',
  },
  // --- Sales: opportunities (Phase 2) ---
  {
    code: Perm.opportunities.create,
    module: 'opportunities',
    description: 'Create opportunities',
  },
  {
    code: Perm.opportunities.read,
    module: 'opportunities',
    description: 'Read opportunities',
  },
  {
    code: Perm.opportunities.update,
    module: 'opportunities',
    description: 'Update opportunities',
  },
  {
    code: Perm.opportunities.delete,
    module: 'opportunities',
    description: 'Delete opportunities',
  },
  {
    code: Perm.opportunities.reassign,
    module: 'opportunities',
    description: 'Reassign opportunities',
  },
  // --- CRM: activities (Phase 3) ---
  {
    code: Perm.activities.create,
    module: 'activities',
    description: 'Create activities',
  },
  {
    code: Perm.activities.read,
    module: 'activities',
    description: 'Read activities',
  },
  {
    code: Perm.activities.update,
    module: 'activities',
    description: 'Update activities (complete / reschedule)',
  },
  {
    code: Perm.activities.delete,
    module: 'activities',
    description: 'Delete activities',
  },
  // --- Sales: dashboard (Phase 4) ---
  {
    code: Perm.dashboard.read,
    module: 'dashboard',
    description: 'View dashboard summary metrics',
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
    // Sales Manager: oversee the team's relationship data tenant-wide.
    Perm.accounts.read,
    Perm.accounts.update,
    Perm.contacts.read,
    Perm.contacts.update,
    // Sales Manager: configure pipelines and oversee all opportunities.
    Perm.pipelines.create,
    Perm.pipelines.read,
    Perm.pipelines.update,
    Perm.pipelines.delete,
    Perm.opportunities.read,
    Perm.opportunities.update,
    Perm.opportunities.reassign,
    // Sales Manager: read all activities tenant-wide.
    Perm.activities.create,
    Perm.activities.read,
    Perm.activities.update,
    Perm.activities.delete,
    // Sales Manager: dashboard with tenant-wide metrics.
    Perm.dashboard.read,
  ],
  USER: [
    Perm.users.read,
    // Sales Agent: full CRUD on their own accounts and contacts.
    Perm.accounts.create,
    Perm.accounts.read,
    Perm.accounts.update,
    Perm.accounts.delete,
    Perm.contacts.create,
    Perm.contacts.read,
    Perm.contacts.update,
    Perm.contacts.delete,
    // Sales Agent: read pipelines, manage their own opportunities.
    Perm.pipelines.read,
    Perm.opportunities.create,
    Perm.opportunities.read,
    Perm.opportunities.update,
    // Sales Agent: full CRUD on their own activities.
    Perm.activities.create,
    Perm.activities.read,
    Perm.activities.update,
    Perm.activities.delete,
    // Sales Agent: dashboard scoped to own data.
    Perm.dashboard.read,
  ],
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
