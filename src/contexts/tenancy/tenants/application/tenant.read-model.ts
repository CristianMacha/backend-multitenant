export interface TenantReadModel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toTenantReadModel(tenant: {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TenantReadModel {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    isActive: tenant.isActive,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}
