import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { OpportunityId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  OPPORTUNITY_REPOSITORY,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';
import { DeleteOpportunityCommand } from './delete-opportunity.command';

@CommandHandler(DeleteOpportunityCommand)
export class DeleteOpportunityHandler implements ICommandHandler<DeleteOpportunityCommand> {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepository: OpportunityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteOpportunityCommand): Promise<void> {
    const opportunity = await this.opportunityRepository.findById(
      OpportunityId(command.id),
      TenantId(command.tenantId),
    );
    if (!opportunity) {
      throw new EntityNotFoundException('Opportunity', command.id);
    }

    opportunity.delete();
    const events = opportunity.pullDomainEvents();
    await this.opportunityRepository.save(opportunity, events);
    this.eventBus.publishAll(events);
  }
}
