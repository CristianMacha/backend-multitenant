export const Perm = {
  users: {
    create: 'users.create',
    read: 'users.read',
    update: 'users.update',
    delete: 'users.delete',
  },
  roles: {
    create: 'roles.create',
    read: 'roles.read',
    update: 'roles.update',
    delete: 'roles.delete',
  },
  permissions: {
    read: 'permissions.read',
  },
  tenants: {
    create: 'tenants.create',
    read: 'tenants.read',
    update: 'tenants.update',
    delete: 'tenants.delete',
  },
  auditLogs: {
    read: 'audit-logs.read',
  },
} as const;

export type PermissionCode =
  (typeof Perm)[keyof typeof Perm][keyof (typeof Perm)[keyof typeof Perm]];
