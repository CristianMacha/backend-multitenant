import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { UserReadModel } from '../user.read-model';

export class GetUsersQuery extends Query<PaginatedResultDto<UserReadModel>> {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
  ) {
    super();
  }
}
