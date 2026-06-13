import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../domain/repositories/account.repository';
import { UpdateAccountCommand } from './update-account.command';

@CommandHandler(UpdateAccountCommand)
export class UpdateAccountHandler implements ICommandHandler<UpdateAccountCommand> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateAccountCommand): Promise<void> {
    const account = await this.accountRepository.findById(
      AccountId(command.id),
      TenantId(command.tenantId),
    );
    if (!account) throw new EntityNotFoundException('Account', command.id);

    account.update(command.changes);
    const events = account.pullDomainEvents();
    await this.accountRepository.save(account, events);
    this.eventBus.publishAll(events);
  }
}
