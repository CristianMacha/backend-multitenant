import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountsModule } from '../accounts/accounts.module';
import { CONTACT_REPOSITORY } from './domain/repositories/contact.repository';
import { PrismaContactRepository } from './infrastructure/repositories/prisma-contact.repository';
import { ContactsController } from './presentation/controllers/contacts.controller';
import { CreateContactHandler } from './application/create-contact/create-contact.handler';
import { UpdateContactHandler } from './application/update-contact/update-contact.handler';
import { LinkContactToAccountHandler } from './application/link-contact-to-account/link-contact-to-account.handler';
import { DeleteContactHandler } from './application/delete-contact/delete-contact.handler';
import { GetContactsHandler } from './application/get-contacts/get-contacts.handler';
import { GetContactByIdHandler } from './application/get-contact-by-id/get-contact-by-id.handler';

const commandHandlers = [
  CreateContactHandler,
  UpdateContactHandler,
  LinkContactToAccountHandler,
  DeleteContactHandler,
];
const queryHandlers = [GetContactsHandler, GetContactByIdHandler];

@Module({
  imports: [CqrsModule, AccountsModule],
  controllers: [ContactsController],
  providers: [
    { provide: CONTACT_REPOSITORY, useClass: PrismaContactRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [CONTACT_REPOSITORY],
})
export class ContactsModule {}
