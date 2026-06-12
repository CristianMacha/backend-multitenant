import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../infrastructure/redis.provider';

const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(
        `Cache GET failed for key "${key}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Cache SET failed for key "${key}": ${(error as Error).message}`,
      );
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.warn(`Cache DEL failed: ${(error as Error).message}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length > 0) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(
        `Cache DEL pattern "${pattern}" failed: ${(error as Error).message}`,
      );
    }
  }

  /** Cache-aside helper: returns cached value or computes and stores it. */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
