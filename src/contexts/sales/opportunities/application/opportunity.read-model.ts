import { Opportunity as PrismaOpportunity } from '@prisma/client';

export interface OpportunityReadModel {
  id: string;
  tenantId: string;
  name: string;
  accountId: string;
  contactId: string | null;
  pipelineId: string;
  stageId: string;
  amount: number;
  currency: string;
  expectedCloseDate: Date | null;
  ownerId: string;
  status: string;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toOpportunityReadModel(
  opportunity: PrismaOpportunity,
): OpportunityReadModel {
  return {
    id: opportunity.id,
    tenantId: opportunity.tenantId,
    name: opportunity.name,
    accountId: opportunity.accountId,
    contactId: opportunity.contactId,
    pipelineId: opportunity.pipelineId,
    stageId: opportunity.stageId,
    amount: opportunity.amount.toNumber(),
    currency: opportunity.currency,
    expectedCloseDate: opportunity.expectedCloseDate,
    ownerId: opportunity.ownerId,
    status: opportunity.status,
    closedAt: opportunity.closedAt,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  };
}
