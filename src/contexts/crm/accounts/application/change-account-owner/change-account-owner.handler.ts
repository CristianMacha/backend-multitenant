import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountId, TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../domain/repositories/account.repository';
import { ChangeAccountOwnerCommand } from './change-account-owner.command';

@CommandHandler(ChangeAccountOwnerCommand)
export class ChangeAccountOwnerHandler implements ICommandHandler<ChangeAccountOwnerCommand> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ChangeAccountOwnerCommand): Promise<void> {
    const account = await this.accountRepository.findById(
      AccountId(command.id),
      TenantId(command.tenantId),
    );
    if (!account) throw new EntityNotFoundException('Account', command.id);

    account.changeOwner(UserId(command.ownerId));
    const events = account.pullDomainEvents();
    await this.accountRepository.save(account, events);
    this.eventBus.publishAll(events);
  }
}
