import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { EntityNotFoundException } from '@shared/exceptions';
import { DeleteUserCommand } from '../commands/delete-user.command';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.id,
      command.tenantId,
    );
    if (!user) {
      throw new EntityNotFoundException('User', command.id);
    }

    user.delete();
    await this.userRepository.save(user);
    this.eventBus.publishAll(user.pullDomainEvents());
  }
}
