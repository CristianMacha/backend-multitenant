import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CacheService } from '@platform/cache/application/cache.service';
import {
  DashboardSummaryReadModel,
  FunnelStageReadModel,
  OpportunityValueByCurrency,
  TaskTodayReadModel,
} from '../dashboard.read-model';
import { GetDashboardSummaryQuery } from './get-dashboard-summary.query';

const CACHE_TTL_SECONDS = 45;

@QueryHandler(GetDashboardSummaryQuery)
export class GetDashboardSummaryHandler implements IQueryHandler<GetDashboardSummaryQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(
    query: GetDashboardSummaryQuery,
  ): Promise<DashboardSummaryReadModel> {
    const cacheKey = `dashboard:summary:${query.tenantId}:${query.currentUserId}:${query.scopedOwnerId ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      () => this.compute(query),
      CACHE_TTL_SECONDS,
    );
  }

  private async compute(
    query: GetDashboardSummaryQuery,
  ): Promise<DashboardSummaryReadModel> {
    const { tenantId, currentUserId, scopedOwnerId } = query;

    const [tasksToday, openOppGroups, wonGroups, funnelSnapshot] =
      await Promise.all([
        this.getTasksToday(tenantId, currentUserId),
        this.getOpenOpportunityValue(tenantId, scopedOwnerId),
        this.getClosedWonThisMonth(tenantId, scopedOwnerId),
        this.getFunnelSnapshot(tenantId, scopedOwnerId),
      ]);

    return {
      tasksToday: { count: tasksToday.length, items: tasksToday },
      openOpportunityValue: openOppGroups,
      closedWonThisMonth: wonGroups,
      funnelSnapshot,
    };
  }

  private async getTasksToday(
    tenantId: string,
    currentUserId: string,
  ): Promise<TaskTodayReadModel[]> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const activities = await this.prisma.activity.findMany({
      where: {
        tenantId,
        ownerId: currentUserId,
        status: 'OPEN',
        dueAt: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      select: {
        id: true,
        subject: true,
        type: true,
        dueAt: true,
        relatedToType: true,
        relatedToId: true,
      },
      orderBy: { dueAt: 'asc' },
    });

    return activities.map((a) => ({
      id: a.id,
      subject: a.subject,
      type: a.type,
      dueAt: a.dueAt!,
      relatedToType: a.relatedToType,
      relatedToId: a.relatedToId,
    }));
  }

  private async getOpenOpportunityValue(
    tenantId: string,
    scopedOwnerId: string | undefined,
  ): Promise<OpportunityValueByCurrency[]> {
    const where: Prisma.OpportunityWhereInput = {
      tenantId,
      status: 'OPEN',
      deletedAt: null,
      ...(scopedOwnerId ? { ownerId: scopedOwnerId } : {}),
    };

    const groups = await this.prisma.opportunity.groupBy({
      by: ['currency'],
      where,
      _count: { id: true },
      _sum: { amount: true },
    });

    return groups.map((g) => ({
      currency: g.currency,
      count: g._count.id,
      totalAmount: Number(g._sum.amount ?? 0),
    }));
  }

  private async getClosedWonThisMonth(
    tenantId: string,
    scopedOwnerId: string | undefined,
  ): Promise<OpportunityValueByCurrency[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const where: Prisma.OpportunityWhereInput = {
      tenantId,
      status: 'WON',
      deletedAt: null,
      closedAt: { gte: startOfMonth },
      ...(scopedOwnerId ? { ownerId: scopedOwnerId } : {}),
    };

    const groups = await this.prisma.opportunity.groupBy({
      by: ['currency'],
      where,
      _count: { id: true },
      _sum: { amount: true },
    });

    return groups.map((g) => ({
      currency: g.currency,
      count: g._count.id,
      totalAmount: Number(g._sum.amount ?? 0),
    }));
  }

  private async getFunnelSnapshot(
    tenantId: string,
    scopedOwnerId: string | undefined,
  ): Promise<FunnelStageReadModel[]> {
    const defaultPipeline = await this.prisma.pipeline.findFirst({
      where: { tenantId, isDefault: true, deletedAt: null },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    if (!defaultPipeline || defaultPipeline.stages.length === 0) return [];

    const where: Prisma.OpportunityWhereInput = {
      tenantId,
      pipelineId: defaultPipeline.id,
      status: 'OPEN',
      deletedAt: null,
      ...(scopedOwnerId ? { ownerId: scopedOwnerId } : {}),
    };

    const stageGroups = await this.prisma.opportunity.groupBy({
      by: ['stageId', 'currency'],
      where,
      _count: { id: true },
      _sum: { amount: true },
    });

    return defaultPipeline.stages.map((stage) => {
      const groups = stageGroups.filter((g) => g.stageId === stage.id);
      const count = groups.reduce((acc, g) => acc + g._count.id, 0);
      const totalAmountByCurrency = groups.map((g) => ({
        currency: g.currency,
        total: Number(g._sum.amount ?? 0),
      }));

      return {
        stageId: stage.id,
        stageName: stage.name,
        order: stage.order,
        stageType: stage.type,
        count,
        totalAmountByCurrency,
      };
    });
  }
}
