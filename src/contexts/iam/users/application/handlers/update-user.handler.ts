import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { EntityNotFoundException } from '@shared/exceptions';
import { UpdateUserCommand } from '../commands/update-user.command';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.id,
      command.tenantId,
    );
    if (!user) {
      throw new EntityNotFoundException('User', command.id);
    }

    user.update(command.changes);
    await this.userRepository.save(user);
    this.eventBus.publishAll(user.pullDomainEvents());
  }
}
