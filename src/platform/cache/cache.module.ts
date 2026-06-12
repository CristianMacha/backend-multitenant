import { Global, Module } from '@nestjs/common';
import { redisProvider, REDIS_CLIENT } from './infrastructure/redis.provider';
import { CacheService } from './application/cache.service';

@Global()
@Module({
  providers: [redisProvider, CacheService],
  exports: [CacheService, REDIS_CLIENT],
})
export class CacheModule {}
