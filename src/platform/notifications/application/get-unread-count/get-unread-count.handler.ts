import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetUnreadCountQuery } from './get-unread-count.query';

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUnreadCountQuery): Promise<number> {
    return this.prisma.notification.count({
      where: {
        tenantId: query.tenantId,
        userId: query.userId,
        read: false,
        deletedAt: null,
      },
    });
  }
}
