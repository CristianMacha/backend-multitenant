import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { EntityAlreadyExistsException } from '@shared/exceptions';
import { CreateUserCommand } from '../commands/create-user.command';
import { User } from '../../domain/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<{ id: string }> {
    const existing = await this.userRepository.findByEmail(
      command.email,
      command.tenantId,
    );
    if (existing) {
      throw new EntityAlreadyExistsException('User', 'email', command.email);
    }

    const user = User.create({
      tenantId: command.tenantId,
      firebaseUid: command.firebaseUid,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
    });

    await this.userRepository.save(user);
    this.eventBus.publishAll(user.pullDomainEvents());

    return { id: user.id };
  }
}
