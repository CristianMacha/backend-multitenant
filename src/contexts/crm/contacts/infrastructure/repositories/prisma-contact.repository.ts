import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { ContactId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Contact } from '../../domain/entities/contact.entity';
import {
  ContactRepository,
  FindContactsOptions,
} from '../../domain/repositories/contact.repository';
import { ContactMapper } from '../mappers/contact.mapper';

@Injectable()
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: ContactId, tenantId: TenantId): Promise<Contact | null> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return contact ? ContactMapper.toDomain(contact) : null;
  }

  async findMany(
    options: FindContactsOptions,
  ): Promise<{ items: Contact[]; total: number }> {
    const where: Prisma.ContactWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.accountId ? { accountId: options.accountId } : {}),
      ...(options.search
        ? {
            OR: [
              { firstName: { contains: options.search, mode: 'insensitive' } },
              { lastName: { contains: options.search, mode: 'insensitive' } },
              { email: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [contacts, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items: contacts.map((contact) => ContactMapper.toDomain(contact)),
      total,
    };
  }

  async save(
    contact: Contact,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = ContactMapper.toPersistence(contact);

    await this.prisma.$transaction(async (tx) => {
      await tx.contact.upsert({
        where: { id: contact.id },
        create: data,
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }
}
