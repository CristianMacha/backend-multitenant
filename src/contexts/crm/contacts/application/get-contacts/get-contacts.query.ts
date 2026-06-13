import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { ContactReadModel } from '../contact.read-model';

export class GetContactsQuery extends Query<
  PaginatedResultDto<ContactReadModel>
> {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
    readonly accountId?: string,
  ) {
    super();
  }
}
