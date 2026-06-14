import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ActivityId, TenantId } from '@shared/domain/types';
import {
  ACTIVITY_REPOSITORY,
  ActivityRepository,
} from '../../domain/repositories/activity.repository';
import { DeleteActivityCommand } from './delete-activity.command';

@CommandHandler(DeleteActivityCommand)
export class DeleteActivityHandler implements ICommandHandler<DeleteActivityCommand> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteActivityCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);
    const activity = await this.activityRepository.findById(
      ActivityId(command.activityId),
      tenantId,
    );
    if (!activity) throw new NotFoundException('Activity not found');

    activity.delete();
    const events = activity.pullDomainEvents();
    await this.activityRepository.save(activity, events);
    this.eventBus.publishAll(events);
  }
}
