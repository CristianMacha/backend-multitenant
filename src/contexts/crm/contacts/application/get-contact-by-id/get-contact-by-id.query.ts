import { Query } from '@nestjs/cqrs';
import { ContactReadModel } from '../contact.read-model';

export class GetContactByIdQuery extends Query<ContactReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
