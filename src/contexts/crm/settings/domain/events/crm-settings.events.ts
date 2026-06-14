import { DomainEvent } from '@shared/domain/domain-event.base';

export class CrmSettingsUpdatedEvent extends DomainEvent {
  readonly eventName = 'crm-settings.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly defaultCurrency: string,
    readonly timezone: string,
  ) {
    super(aggregateId, tenantId);
  }
}
