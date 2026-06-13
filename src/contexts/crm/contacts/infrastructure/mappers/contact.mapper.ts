import { Prisma, Contact as PrismaContact } from '@prisma/client';
import { AccountId, TenantId, UserId } from '@shared/domain/types';
import { Contact } from '../../domain/entities/contact.entity';

export class ContactMapper {
  static toDomain(raw: PrismaContact): Contact {
    return Contact.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phone: raw.phone,
      jobTitle: raw.jobTitle ?? undefined,
      accountId: raw.accountId ? AccountId(raw.accountId) : undefined,
      ownerId: UserId(raw.ownerId),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(contact: Contact): Prisma.ContactUncheckedCreateInput {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      jobTitle: contact.jobTitle ?? null,
      accountId: contact.accountId ?? null,
      ownerId: contact.ownerId,
      deletedAt: contact.deletedAt,
    };
  }
}
