import { Activity as PrismaActivity } from '@prisma/client';

export interface ActivityReadModel {
  id: string;
  tenantId: string;
  type: string;
  subject: string;
  body: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  status: string;
  ownerId: string | null;
  source: string;
  relatedToType: string;
  relatedToId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toActivityReadModel(raw: PrismaActivity): ActivityReadModel {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    type: raw.type,
    subject: raw.subject,
    body: raw.body,
    dueAt: raw.dueAt,
    completedAt: raw.completedAt,
    status: raw.status,
    ownerId: raw.ownerId,
    source: raw.source,
    relatedToType: raw.relatedToType,
    relatedToId: raw.relatedToId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
