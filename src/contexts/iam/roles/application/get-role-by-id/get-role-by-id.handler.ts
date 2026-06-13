import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RoleReadModel, toRoleReadModel } from '../role.read-model';
import { GetRoleByIdQuery } from './get-role-by-id.query';

@QueryHandler(GetRoleByIdQuery)
export class GetRoleByIdHandler implements IQueryHandler<GetRoleByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRoleByIdQuery): Promise<RoleReadModel> {
    const role = await this.prisma.role.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new EntityNotFoundException('Role', query.id);
    return toRoleReadModel(role);
  }
}
