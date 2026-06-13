import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserReadModel, toUserReadModel } from '../user.read-model';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadModel> {
    const user = await this.prisma.user.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new EntityNotFoundException('User', query.id);

    return toUserReadModel(user);
  }
}
