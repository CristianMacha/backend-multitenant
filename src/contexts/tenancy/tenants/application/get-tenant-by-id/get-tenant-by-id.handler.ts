import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { TenantReadModel, toTenantReadModel } from '../tenant.read-model';
import { GetTenantByIdQuery } from './get-tenant-by-id.query';

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantByIdQuery): Promise<TenantReadModel> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: query.id, deletedAt: null },
    });
    if (!tenant) throw new EntityNotFoundException('Tenant', query.id);
    return toTenantReadModel(tenant);
  }
}
