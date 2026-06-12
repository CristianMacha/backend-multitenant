import { BaseEntityProps, Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

export abstract class AggregateRoot<
  TProps extends BaseEntityProps,
> extends Entity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
