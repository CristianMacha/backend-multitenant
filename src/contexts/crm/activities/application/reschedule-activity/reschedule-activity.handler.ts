import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ActivityId, TenantId } from '@shared/domain/types';
import { JobsService } from '@platform/jobs/application/jobs.service';
import {
  ACTIVITY_REPOSITORY,
  ActivityRepository,
} from '../../domain/repositories/activity.repository';
import { RescheduleActivityCommand } from './reschedule-activity.command';

@CommandHandler(RescheduleActivityCommand)
export class RescheduleActivityHandler implements ICommandHandler<RescheduleActivityCommand> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,
    private readonly eventBus: EventBus,
    private readonly jobsService: JobsService,
  ) {}

  async execute(command: RescheduleActivityCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);
    const activity = await this.activityRepository.findById(
      ActivityId(command.activityId),
      tenantId,
    );
    if (!activity) throw new NotFoundException('Activity not found');

    activity.reschedule(command.dueAt);
    const events = activity.pullDomainEvents();
    await this.activityRepository.save(activity, events);
    this.eventBus.publishAll(events);

    const delayMs = command.dueAt.getTime() - Date.now();
    if (delayMs > 0) {
      await this.jobsService.enqueueActivityReminder(
        {
          activityId: activity.id,
          tenantId: activity.tenantId,
          dueAt: command.dueAt.toISOString(),
        },
        delayMs,
      );
    }
  }
}
