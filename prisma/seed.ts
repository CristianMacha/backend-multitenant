import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: 'users.create', module: 'users', description: 'Create users' },
  { code: 'users.read', module: 'users', description: 'Read users' },
  { code: 'users.update', module: 'users', description: 'Update users' },
  { code: 'users.delete', module: 'users', description: 'Delete users' },
  { code: 'roles.create', module: 'roles', description: 'Create roles' },
  { code: 'roles.read', module: 'roles', description: 'Read roles' },
  { code: 'roles.update', module: 'roles', description: 'Update roles' },
  { code: 'roles.delete', module: 'roles', description: 'Delete roles' },
  {
    code: 'permissions.read',
    module: 'permissions',
    description: 'Read permissions',
  },
  { code: 'tenants.create', module: 'tenants', description: 'Create tenants' },
  { code: 'tenants.read', module: 'tenants', description: 'Read tenants' },
  { code: 'tenants.update', module: 'tenants', description: 'Update tenants' },
  { code: 'tenants.delete', module: 'tenants', description: 'Delete tenants' },
  {
    code: 'audit-logs.read',
    module: 'audit-logs',
    description: 'Read audit logs',
  },
];

const SYSTEM_ROLES: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.code),
  ADMIN: PERMISSIONS.filter((p) => !p.code.startsWith('tenants.')).map(
    (p) => p.code,
  ),
  MANAGER: [
    'users.read',
    'users.update',
    'roles.read',
    'permissions.read',
    'audit-logs.read',
  ],
  USER: ['users.read'],
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
