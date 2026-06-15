import { PermissionCode } from '@shared/authorization/permissions';

export interface MenuNode {
  id: string;
  permission?: PermissionCode;
  platformAdminOnly?: boolean;
  children?: MenuNode[];
}

export const MENU_DEFINITION: MenuNode[] = [
  { id: 'dashboard', permission: 'dashboard.read' },
  {
    id: 'crm',
    children: [
      { id: 'accounts', permission: 'accounts.read' },
      { id: 'contacts', permission: 'contacts.read' },
      { id: 'pipeline', permission: 'opportunities.read' },
      { id: 'activities', permission: 'activities.read' },
    ],
  },
  {
    id: 'catalog',
    children: [{ id: 'products', permission: 'products.read' }],
  },
  {
    id: 'settings',
    children: [
      { id: 'settings-users', permission: 'users.read' },
      { id: 'settings-roles', permission: 'roles.read' },
      { id: 'settings-crm', permission: 'crm-settings.read' },
      { id: 'settings-audit', permission: 'audit-logs.read' },
      {
        id: 'settings-tenants',
        permission: 'tenants.read',
        platformAdminOnly: true,
      },
    ],
  },
];
