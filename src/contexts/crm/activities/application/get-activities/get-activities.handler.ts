import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ActivityReadModel, toActivityReadModel } from '../activity.read-model';
import { GetActivitiesQuery } from './get-activities.query';

@QueryHandler(GetActivitiesQuery)
export class GetActivitiesHandler implements IQueryHandler<GetActivitiesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetActivitiesQuery,
  ): Promise<PaginatedResultDto<ActivityReadModel>> {
    const where: Prisma.ActivityWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.relatedToType
        ? {
            relatedToType:
              query.relatedToType as Prisma.EnumRelatedToTypeFilter['equals'],
          }
        : {}),
      ...(query.relatedToId ? { relatedToId: query.relatedToId } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.status
        ? { status: query.status as Prisma.EnumActivityStatusFilter['equals'] }
        : {}),
      ...(query.dueDateFrom || query.dueDateTo
        ? {
            dueAt: {
              ...(query.dueDateFrom ? { gte: query.dueDateFrom } : {}),
              ...(query.dueDateTo ? { lte: query.dueDateTo } : {}),
            },
          }
        : {}),
    };

    const [activities, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return PaginatedResultDto.of(
      activities.map(toActivityReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
