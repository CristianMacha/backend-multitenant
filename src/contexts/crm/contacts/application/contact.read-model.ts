import { Contact as PrismaContact } from '@prisma/client';

export interface ContactReadModel {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  accountId: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toContactReadModel(contact: PrismaContact): ContactReadModel {
  return {
    id: contact.id,
    tenantId: contact.tenantId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    fullName: `${contact.firstName} ${contact.lastName}`.trim(),
    email: contact.email,
    phone: contact.phone,
    jobTitle: contact.jobTitle,
    accountId: contact.accountId,
    ownerId: contact.ownerId,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}
