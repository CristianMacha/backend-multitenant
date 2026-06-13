import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { AccountReadModel } from '../account.read-model';

export class GetAccountsQuery extends Query<
  PaginatedResultDto<AccountReadModel>
> {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
  ) {
    super();
  }
}
