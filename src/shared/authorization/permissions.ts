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
  // --- CRM (crm + sales contexts). Reserved here; registered in prisma/seed.ts
  // and enforced on routes as each module lands per the CRM plan phases. ---
  accounts: {
    create: 'accounts.create',
    read: 'accounts.read',
    update: 'accounts.update',
    delete: 'accounts.delete',
  },
  contacts: {
    create: 'contacts.create',
    read: 'contacts.read',
    update: 'contacts.update',
    delete: 'contacts.delete',
  },
  pipelines: {
    create: 'pipelines.create',
    read: 'pipelines.read',
    update: 'pipelines.update',
    delete: 'pipelines.delete',
  },
  opportunities: {
    create: 'opportunities.create',
    read: 'opportunities.read',
    update: 'opportunities.update',
    delete: 'opportunities.delete',
    reassign: 'opportunities.reassign',
  },
  activities: {
    create: 'activities.create',
    read: 'activities.read',
    update: 'activities.update',
    delete: 'activities.delete',
  },
  dashboard: {
    read: 'dashboard.read',
  },
  crmSettings: {
    read: 'crm-settings.read',
    update: 'crm-settings.update',
  },
  notifications: {
    read: 'notifications.read',
    update: 'notifications.update',
  },
  // --- Catalog: products ---
  products: {
    create: 'products.create',
    read: 'products.read',
    update: 'products.update',
    delete: 'products.delete',
  },
} as const;

export type PermissionCode =
  (typeof Perm)[keyof typeof Perm][keyof (typeof Perm)[keyof typeof Perm]];
