import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AssignRoleCommand } from '../commands/assign-role.command';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

@CommandHandler(AssignRoleCommand)
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AssignRoleCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );
    if (!user) {
      throw new EntityNotFoundException('User', command.userId);
    }

    const role = await this.prisma.role.findFirst({
      where: {
        id: command.roleId,
        tenantId: command.tenantId,
        deletedAt: null,
      },
    });
    if (!role) {
      throw new EntityNotFoundException('Role', command.roleId);
    }

    user.assignRole(command.roleId);
    await this.userRepository.save(user);
    this.eventBus.publishAll(user.pullDomainEvents());
  }
}
