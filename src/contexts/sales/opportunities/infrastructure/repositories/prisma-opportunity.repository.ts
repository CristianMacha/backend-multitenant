import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { ContactId, OpportunityId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import {
  FindOpportunitiesOptions,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';
import { OpportunityMapper } from '../mappers/opportunity.mapper';

@Injectable()
export class PrismaOpportunityRepository implements OpportunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: OpportunityId,
    tenantId: TenantId,
  ): Promise<Opportunity | null> {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return opportunity ? OpportunityMapper.toDomain(opportunity) : null;
  }

  async findByContactId(
    contactId: ContactId,
    tenantId: TenantId,
  ): Promise<Opportunity[]> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: { contactId, tenantId, deletedAt: null },
    });
    return opportunities.map((o) => OpportunityMapper.toDomain(o));
  }

  async findMany(
    options: FindOpportunitiesOptions,
  ): Promise<{ items: Opportunity[]; total: number }> {
    const where: Prisma.OpportunityWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.pipelineId ? { pipelineId: options.pipelineId } : {}),
      ...(options.stageId ? { stageId: options.stageId } : {}),
      ...(options.ownerId ? { ownerId: options.ownerId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? { name: { contains: options.search, mode: 'insensitive' } }
        : {}),
    };

    const [opportunities, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return {
      items: opportunities.map((o) => OpportunityMapper.toDomain(o)),
      total,
    };
  }

  async save(
    opportunity: Opportunity,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = OpportunityMapper.toPersistence(opportunity);

    await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.upsert({
        where: { id: opportunity.id },
        create: data,
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }
}
