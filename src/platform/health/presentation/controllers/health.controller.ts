import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import Redis from 'ioredis';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { REDIS_CLIENT } from '@platform/cache/infrastructure/redis.provider';
import { Public } from '@shared/presentation/decorators/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check (database, redis, memory)' })
  @ApiResponse({
    status: 200,
    description: 'All systems healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'One or more dependencies are down',
  })
  check() {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkRedis(),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (dependencies reachable)' })
  @ApiResponse({ status: 200, description: 'All dependencies reachable' })
  @ApiResponse({
    status: 503,
    description: 'One or more dependencies are down',
  })
  ready() {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkRedis(),
    ]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (error) {
      return {
        database: { status: 'down', message: (error as Error).message },
      };
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return { redis: { status: 'up' } };
    } catch (error) {
      return { redis: { status: 'down', message: (error as Error).message } };
    }
  }
}
