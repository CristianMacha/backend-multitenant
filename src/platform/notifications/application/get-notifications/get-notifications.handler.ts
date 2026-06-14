import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  NotificationReadModel,
  toNotificationReadModel,
} from '../notification.read-model';
import { GetNotificationsQuery } from './get-notifications.query';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetNotificationsQuery,
  ): Promise<PaginatedResultDto<NotificationReadModel>> {
    const where = {
      tenantId: query.tenantId,
      userId: query.userId,
      deletedAt: null,
    };

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return PaginatedResultDto.of(
      notifications.map(toNotificationReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
