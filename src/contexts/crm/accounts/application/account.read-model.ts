import { Account as PrismaAccount } from '@prisma/client';
import { AddressProps } from '@shared/domain/value-objects/address.vo';

export interface AccountReadModel {
  id: string;
  tenantId: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: AddressProps | null;
  ownerId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toAccountReadModel(account: PrismaAccount): AccountReadModel {
  return {
    id: account.id,
    tenantId: account.tenantId,
    name: account.name,
    industry: account.industry,
    website: account.website,
    phone: account.phone,
    address: (account.address as AddressProps | null) ?? null,
    ownerId: account.ownerId,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
