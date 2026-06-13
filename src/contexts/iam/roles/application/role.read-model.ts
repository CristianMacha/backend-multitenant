export interface RoleReadModel {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function toRoleReadModel(role: {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions: { permission: { code: string } }[];
}): RoleReadModel {
  return {
    id: role.id,
    tenantId: role.tenantId,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map((rp) => rp.permission.code),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
