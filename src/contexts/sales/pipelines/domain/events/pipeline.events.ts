import { DomainEvent } from '@shared/domain/domain-event.base';

export class PipelineCreatedEvent extends DomainEvent {
  readonly eventName = 'pipeline.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly name: string,
    readonly isDefault: boolean,
  ) {
    super(aggregateId, tenantId);
  }
}

export class PipelineUpdatedEvent extends DomainEvent {
  readonly eventName = 'pipeline.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class StageAddedEvent extends DomainEvent {
  readonly eventName = 'pipeline.stage-added';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly stageId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class StageRemovedEvent extends DomainEvent {
  readonly eventName = 'pipeline.stage-removed';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly stageId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class StagesReorderedEvent extends DomainEvent {
  readonly eventName = 'pipeline.stages-reordered';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly stageOrder: string[],
  ) {
    super(aggregateId, tenantId);
  }
}
