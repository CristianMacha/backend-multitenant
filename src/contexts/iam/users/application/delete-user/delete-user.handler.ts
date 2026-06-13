import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { DeleteUserCommand } from './delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      UserId(command.id),
      TenantId(command.tenantId),
    );
    if (!user) throw new EntityNotFoundException('User', command.id);

    user.delete();
    const events = user.pullDomainEvents();
    await this.userRepository.save(user, events);
    this.eventBus.publishAll(events);
  }
}
