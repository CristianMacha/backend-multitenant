import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetUserByIdQuery } from '../queries/get-user-by-id.query';
import { UserReadModel } from '../read-models/user.read-model';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadModel> {
    const user = await this.prisma.user.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new EntityNotFoundException('User', query.id);
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.userRoles.map((userRole) => userRole.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
