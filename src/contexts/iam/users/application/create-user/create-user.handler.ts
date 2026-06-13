import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { EntityAlreadyExistsException } from '@shared/exceptions';
import { User } from '../../domain/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<{ id: string }> {
    const tenantId = TenantId(command.tenantId);

    const existing = await this.userRepository.findByEmail(
      command.email,
      tenantId,
    );
    if (existing) {
      throw new EntityAlreadyExistsException('User', 'email', command.email);
    }

    const user = User.create({
      tenantId,
      firebaseUid: command.firebaseUid,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
    });

    const events = user.pullDomainEvents();
    await this.userRepository.save(user, events);
    this.eventBus.publishAll(events);

    return { id: user.id };
  }
}
