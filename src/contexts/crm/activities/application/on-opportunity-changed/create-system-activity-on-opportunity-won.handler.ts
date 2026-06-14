import { Inject, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { OpportunityWonEvent } from '@contexts/sales/opportunities/domain/events/opportunity.events';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Activity } from '../../domain/entities/activity.entity';
import {
  ACTIVITY_REPOSITORY,
  ActivityRepository,
} from '../../domain/repositories/activity.repository';

@EventsHandler(OpportunityWonEvent)
export class CreateSystemActivityOnOpportunityWonHandler implements IEventHandler<OpportunityWonEvent> {
  private readonly logger = new Logger(
    CreateSystemActivityOnOpportunityWonHandler.name,
  );

  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: OpportunityWonEvent): Promise<void> {
    if (!event.tenantId) return;

    try {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: {
          id: event.aggregateId,
          tenantId: event.tenantId,
          deletedAt: null,
        },
        select: { accountId: true, name: true },
      });

      if (!opportunity) return;

      const activity = Activity.create({
        tenantId: TenantId(event.tenantId),
        type: 'SYSTEM',
        subject: `Opportunity won — ${event.amount} ${event.currency}`,
        source: 'SYSTEM',
        relatedToType: 'ACCOUNT',
        relatedToId: opportunity.accountId,
      });

      const events = activity.pullDomainEvents();
      await this.activityRepository.save(activity, events);
      this.eventBus.publishAll(events);
    } catch (err) {
      this.logger.error(
        `Failed to create system activity for opportunity.won: ${(err as Error).message}`,
      );
    }
  }
}
