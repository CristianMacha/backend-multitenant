export interface UserReadModel {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function toUserReadModel(user: {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userRoles: { role: { name: string } }[];
}): UserReadModel {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: user.userRoles.map((ur) => ur.role.name),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
