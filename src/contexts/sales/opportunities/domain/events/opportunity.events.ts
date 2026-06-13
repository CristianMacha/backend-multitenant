import { DomainEvent } from '@shared/domain/domain-event.base';

export class OpportunityCreatedEvent extends DomainEvent {
  readonly eventName = 'opportunity.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly name: string,
    readonly accountId: string,
    readonly ownerId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class OpportunityUpdatedEvent extends DomainEvent {
  readonly eventName = 'opportunity.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class OpportunityStageChangedEvent extends DomainEvent {
  readonly eventName = 'opportunity.stage-changed';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly stageId: string,
    readonly status: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class OpportunityWonEvent extends DomainEvent {
  readonly eventName = 'opportunity.won';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly amount: number,
    readonly currency: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class OpportunityLostEvent extends DomainEvent {
  readonly eventName = 'opportunity.lost';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class OpportunityReassignedEvent extends DomainEvent {
  readonly eventName = 'opportunity.reassigned';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly ownerId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class OpportunityAmountChangedEvent extends DomainEvent {
  readonly eventName = 'opportunity.amount-changed';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly amount: number,
    readonly currency: string,
  ) {
    super(aggregateId, tenantId);
  }
}
