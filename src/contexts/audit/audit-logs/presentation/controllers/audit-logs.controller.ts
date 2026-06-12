import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { AuditLogsQueryDto } from '../dto/audit-logs-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('audit-logs.read')
  @ApiOperation({ summary: 'Query audit logs (paginated)' })
  async findAll(
    @Query() query: AuditLogsQueryDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return PaginatedResultDto.of(logs, total, query.page, query.limit);
  }
}
