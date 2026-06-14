import { Inject, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { OpportunityCreatedEvent } from '@contexts/sales/opportunities/domain/events/opportunity.events';
import { Activity } from '../../domain/entities/activity.entity';
import {
  ACTIVITY_REPOSITORY,
  ActivityRepository,
} from '../../domain/repositories/activity.repository';

@EventsHandler(OpportunityCreatedEvent)
export class CreateSystemActivityOnOpportunityCreatedHandler implements IEventHandler<OpportunityCreatedEvent> {
  private readonly logger = new Logger(
    CreateSystemActivityOnOpportunityCreatedHandler.name,
  );

  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async handle(event: OpportunityCreatedEvent): Promise<void> {
    if (!event.tenantId) return;

    try {
      const activity = Activity.create({
        tenantId: TenantId(event.tenantId),
        type: 'SYSTEM',
        subject: `Opportunity "${event.name}" created`,
        source: 'SYSTEM',
        relatedToType: 'ACCOUNT',
        relatedToId: event.accountId,
      });

      const events = activity.pullDomainEvents();
      await this.activityRepository.save(activity, events);
      this.eventBus.publishAll(events);
    } catch (err) {
      this.logger.error(
        `Failed to create system activity for opportunity.created: ${(err as Error).message}`,
      );
    }
  }
}
