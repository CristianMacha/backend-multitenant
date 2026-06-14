import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  AccountId,
  ContactId,
  OpportunityId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { BusinessException } from '@shared/exceptions';
import { CRM_LOOKUP, CrmLookup } from '@contexts/crm/lookup/crm-lookup.port';
import {
  SALES_LOOKUP,
  SalesLookup,
} from '@contexts/sales/lookup/sales-lookup.port';
import { JobsService } from '@platform/jobs/application/jobs.service';
import {
  Activity,
  ActivitySource,
  ActivityType,
  RelatedToType,
} from '../../domain/entities/activity.entity';
import {
  ACTIVITY_REPOSITORY,
  ActivityRepository,
} from '../../domain/repositories/activity.repository';
import { CreateActivityCommand } from './create-activity.command';

@CommandHandler(CreateActivityCommand)
export class CreateActivityHandler implements ICommandHandler<CreateActivityCommand> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,
    @Inject(CRM_LOOKUP)
    private readonly crmLookup: CrmLookup,
    @Inject(SALES_LOOKUP)
    private readonly salesLookup: SalesLookup,
    private readonly eventBus: EventBus,
    private readonly jobsService: JobsService,
  ) {}

  async execute(command: CreateActivityCommand): Promise<{ id: string }> {
    const tenantId = TenantId(command.tenantId);
    const relatedToType = command.relatedToType as RelatedToType;

    await this.assertRelatedRecordExists(
      relatedToType,
      command.relatedToId,
      tenantId,
    );

    const activity = Activity.create({
      tenantId,
      type: command.type as ActivityType,
      subject: command.subject,
      body: command.body,
      dueAt: command.dueAt,
      ownerId: command.ownerId ? UserId(command.ownerId) : undefined,
      source: (command.source as ActivitySource) ?? 'USER',
      relatedToType,
      relatedToId: command.relatedToId,
    });

    const events = activity.pullDomainEvents();
    await this.activityRepository.save(activity, events);
    this.eventBus.publishAll(events);

    if (activity.dueAt) {
      const delayMs = activity.dueAt.getTime() - Date.now();
      if (delayMs > 0) {
        await this.jobsService.enqueueActivityReminder(
          {
            activityId: activity.id,
            tenantId: activity.tenantId,
            dueAt: activity.dueAt.toISOString(),
          },
          delayMs,
        );
      }
    }

    return { id: activity.id };
  }

  private async assertRelatedRecordExists(
    relatedToType: RelatedToType,
    relatedToId: string,
    tenantId: TenantId,
  ): Promise<void> {
    let exists = false;

    if (relatedToType === 'ACCOUNT') {
      exists = await this.crmLookup.accountExists(
        AccountId(relatedToId),
        tenantId,
      );
    } else if (relatedToType === 'CONTACT') {
      exists = await this.crmLookup.contactExists(
        ContactId(relatedToId),
        tenantId,
      );
    } else if (relatedToType === 'OPPORTUNITY') {
      exists = await this.salesLookup.opportunityExists(
        OpportunityId(relatedToId),
        tenantId,
      );
    }

    if (!exists) {
      throw new BusinessException(
        `${relatedToType} with id ${relatedToId} not found`,
        'RELATED_RECORD_NOT_FOUND',
        404,
      );
    }
  }
}
