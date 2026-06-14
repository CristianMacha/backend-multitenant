import { Product as PrismaProduct } from '@prisma/client';

export interface ProductReadModel {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: string;
  category: string | null;
  unitPrice: { amount: number; currency: string };
  unitOfMeasure: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductReadModel(raw: PrismaProduct): ProductReadModel {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    description: raw.description,
    type: raw.type,
    category: raw.category,
    unitPrice: {
      amount: Number(raw.unitPrice),
      currency: raw.currency,
    },
    unitOfMeasure: raw.unitOfMeasure,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
