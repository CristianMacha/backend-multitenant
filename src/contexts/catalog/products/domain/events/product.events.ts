import { DomainEvent } from '@shared/domain/domain-event.base';

export class ProductCreatedEvent extends DomainEvent {
  readonly eventName = 'product.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly name: string,
    readonly type: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ProductUpdatedEvent extends DomainEvent {
  readonly eventName = 'product.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ProductArchivedEvent extends DomainEvent {
  readonly eventName = 'product.archived';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}
