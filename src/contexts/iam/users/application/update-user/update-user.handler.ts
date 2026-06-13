import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { UpdateUserCommand } from './update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      UserId(command.id),
      TenantId(command.tenantId),
    );
    if (!user) throw new EntityNotFoundException('User', command.id);

    user.update(command.changes);
    const events = user.pullDomainEvents();
    await this.userRepository.save(user, events);
    this.eventBus.publishAll(events);
  }
}
