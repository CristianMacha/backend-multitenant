import { DomainEvent } from '@shared/domain/domain-event.base';
import {
  ContactId,
  OpportunityId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { Opportunity, OpportunityStatus } from '../entities/opportunity.entity';

export const OPPORTUNITY_REPOSITORY = Symbol('OPPORTUNITY_REPOSITORY');

export interface FindOpportunitiesOptions {
  tenantId: TenantId;
  page: number;
  limit: number;
  pipelineId?: PipelineId;
  stageId?: StageId;
  ownerId?: UserId;
  status?: OpportunityStatus;
  search?: string;
}

export interface OpportunityRepository {
  findById(id: OpportunityId, tenantId: TenantId): Promise<Opportunity | null>;
  findByContactId(
    contactId: ContactId,
    tenantId: TenantId,
  ): Promise<Opportunity[]>;
  findMany(
    options: FindOpportunitiesOptions,
  ): Promise<{ items: Opportunity[]; total: number }>;
  save(opportunity: Opportunity, outboxEvents?: DomainEvent[]): Promise<void>;
}
