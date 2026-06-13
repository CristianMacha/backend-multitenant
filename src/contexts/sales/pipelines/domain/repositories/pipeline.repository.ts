import { DomainEvent } from '@shared/domain/domain-event.base';
import { PipelineId, TenantId } from '@shared/domain/types';
import { Pipeline } from '../entities/pipeline.entity';

export const PIPELINE_REPOSITORY = Symbol('PIPELINE_REPOSITORY');

export interface PipelineRepository {
  findById(id: PipelineId, tenantId: TenantId): Promise<Pipeline | null>;
  findAll(tenantId: TenantId): Promise<Pipeline[]>;
  save(pipeline: Pipeline, outboxEvents?: DomainEvent[]): Promise<void>;
}
