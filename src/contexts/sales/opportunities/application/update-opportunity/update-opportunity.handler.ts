import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ContactId, OpportunityId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import { CRM_LOOKUP, CrmLookup } from '@contexts/crm/lookup/crm-lookup.port';
import {
  OPPORTUNITY_REPOSITORY,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';
import { UpdateOpportunityCommand } from './update-opportunity.command';

@CommandHandler(UpdateOpportunityCommand)
export class UpdateOpportunityHandler implements ICommandHandler<UpdateOpportunityCommand> {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepository: OpportunityRepository,
    @Inject(CRM_LOOKUP) private readonly crm: CrmLookup,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateOpportunityCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);
    const { changes } = command;

    const opportunity = await this.opportunityRepository.findById(
      OpportunityId(command.id),
      tenantId,
    );
    if (!opportunity) {
      throw new EntityNotFoundException('Opportunity', command.id);
    }

    let contactId: ContactId | null | undefined = changes.contactId as
      | ContactId
      | null
      | undefined;
    if (changes.contactId) {
      contactId = ContactId(changes.contactId);
      if (!(await this.crm.contactExists(contactId, tenantId))) {
        throw new EntityNotFoundException('Contact', changes.contactId);
      }
    }

    opportunity.update({
      name: changes.name,
      contactId: contactId === undefined ? undefined : contactId,
      expectedCloseDate: changes.expectedCloseDate,
    });

    if (changes.amount !== undefined) {
      opportunity.changeAmount(
        changes.amount,
        changes.currency ?? opportunity.currency,
      );
    }

    const events = opportunity.pullDomainEvents();
    await this.opportunityRepository.save(opportunity, events);
    this.eventBus.publishAll(events);
  }
}
