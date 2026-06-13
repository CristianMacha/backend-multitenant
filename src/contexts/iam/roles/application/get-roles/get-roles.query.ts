import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { RoleReadModel } from '../role.read-model';

export class GetRolesQuery extends Query<PaginatedResultDto<RoleReadModel>> {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
  ) {
    super();
  }
}
