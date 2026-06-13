import { Inject, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ContactId, TenantId } from '@shared/domain/types';
import { ContactDeletedEvent } from '@contexts/crm/contacts/domain/events/contact.events';
import {
  OPPORTUNITY_REPOSITORY,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';

/**
 * Cross-context reaction: when a contact is deleted in the `crm` context, drop
 * the dangling contact reference from any opportunity that pointed to it.
 * Consumes only the event payload from the in-process EventBus — no crm
 * repositories or entities are imported.
 */
@EventsHandler(ContactDeletedEvent)
export class ClearContactOnContactDeletedHandler implements IEventHandler<ContactDeletedEvent> {
  private readonly logger = new Logger(
    ClearContactOnContactDeletedHandler.name,
  );

  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepository: OpportunityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async handle(event: ContactDeletedEvent): Promise<void> {
    if (!event.tenantId) return;
    const tenantId = TenantId(event.tenantId);
    const contactId = ContactId(event.aggregateId);

    const opportunities = await this.opportunityRepository.findByContactId(
      contactId,
      tenantId,
    );

    for (const opportunity of opportunities) {
      opportunity.clearContact();
      const events = opportunity.pullDomainEvents();
      await this.opportunityRepository.save(opportunity, events);
      this.eventBus.publishAll(events);
    }

    if (opportunities.length > 0) {
      this.logger.debug(
        `Cleared contact ${contactId} from ${opportunities.length} opportunity(ies)`,
      );
    }
  }
}
