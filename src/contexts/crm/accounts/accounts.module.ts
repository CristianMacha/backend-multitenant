import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ACCOUNT_REPOSITORY } from './domain/repositories/account.repository';
import { PrismaAccountRepository } from './infrastructure/repositories/prisma-account.repository';
import { AccountsController } from './presentation/controllers/accounts.controller';
import { CreateAccountHandler } from './application/create-account/create-account.handler';
import { UpdateAccountHandler } from './application/update-account/update-account.handler';
import { ArchiveAccountHandler } from './application/archive-account/archive-account.handler';
import { ChangeAccountOwnerHandler } from './application/change-account-owner/change-account-owner.handler';
import { GetAccountsHandler } from './application/get-accounts/get-accounts.handler';
import { GetAccountByIdHandler } from './application/get-account-by-id/get-account-by-id.handler';

const commandHandlers = [
  CreateAccountHandler,
  UpdateAccountHandler,
  ArchiveAccountHandler,
  ChangeAccountOwnerHandler,
];
const queryHandlers = [GetAccountsHandler, GetAccountByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [AccountsController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountsModule {}
