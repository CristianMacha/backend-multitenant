import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId, UserId } from '@shared/domain/types';
import { Account } from '../../domain/entities/account.entity';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../domain/repositories/account.repository';
import { CreateAccountCommand } from './create-account.command';

@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler implements ICommandHandler<CreateAccountCommand> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateAccountCommand): Promise<{ id: string }> {
    const account = Account.create({
      tenantId: TenantId(command.tenantId),
      ownerId: UserId(command.ownerId),
      name: command.name,
      industry: command.industry,
      website: command.website,
      phone: command.phone,
      address: command.address,
    });

    const events = account.pullDomainEvents();
    await this.accountRepository.save(account, events);
    this.eventBus.publishAll(events);

    return { id: account.id };
  }
}
