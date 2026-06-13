import { Prisma, Opportunity as PrismaOpportunity } from '@prisma/client';
import {
  AccountId,
  ContactId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { Opportunity } from '../../domain/entities/opportunity.entity';

export class OpportunityMapper {
  static toDomain(raw: PrismaOpportunity): Opportunity {
    return Opportunity.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      name: raw.name,
      accountId: AccountId(raw.accountId),
      contactId: raw.contactId ? ContactId(raw.contactId) : undefined,
      pipelineId: PipelineId(raw.pipelineId),
      stageId: StageId(raw.stageId),
      amount: raw.amount.toNumber(),
      currency: raw.currency,
      expectedCloseDate: raw.expectedCloseDate ?? undefined,
      ownerId: UserId(raw.ownerId),
      status: raw.status,
      closedAt: raw.closedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(
    opportunity: Opportunity,
  ): Prisma.OpportunityUncheckedCreateInput {
    return {
      id: opportunity.id,
      tenantId: opportunity.tenantId,
      name: opportunity.name,
      accountId: opportunity.accountId,
      contactId: opportunity.contactId ?? null,
      pipelineId: opportunity.pipelineId,
      stageId: opportunity.stageId,
      amount: new Prisma.Decimal(opportunity.amount),
      currency: opportunity.currency,
      expectedCloseDate: opportunity.expectedCloseDate ?? null,
      ownerId: opportunity.ownerId,
      status: opportunity.status,
      closedAt: opportunity.closedAt,
      deletedAt: opportunity.deletedAt,
    };
  }
}
