import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ActivityReadModel, toActivityReadModel } from '../activity.read-model';
import { GetRecordTimelineQuery } from './get-record-timeline.query';
import { RelatedToType } from '../../domain/entities/activity.entity';

@QueryHandler(GetRecordTimelineQuery)
export class GetRecordTimelineHandler implements IQueryHandler<GetRecordTimelineQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRecordTimelineQuery): Promise<ActivityReadModel[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        tenantId: query.tenantId,
        relatedToType: query.relatedToType as RelatedToType,
        relatedToId: query.relatedToId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return activities.map(toActivityReadModel);
  }
}
