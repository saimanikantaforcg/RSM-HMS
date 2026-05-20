import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

/**
 * Use ioredis-mock ONLY in test environments or when USE_REDIS_MOCK=true is set.
 * In all other environments (development, production) a real Redis connection is required.
 * Without real Redis: refresh token revocation silently fails across restarts,
 * and SSE notifications do not broadcast across multiple instances.
 */
const useMock =
  process.env.NODE_ENV === 'test' || process.env.USE_REDIS_MOCK === 'true';

function createRedisClient() {
  if (useMock) return new RedisMock();
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    enableOfflineQueue: true,
    lazyConnect: false,
  });
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_PUB',
      useFactory: () => createRedisClient(),
    },
    {
      provide: 'REDIS_SUB',
      useFactory: () => createRedisClient(),
    },
    {
      provide: 'REDIS_CLIENT',
      useExisting: 'REDIS_PUB',
    },
  ],
  exports: ['REDIS_PUB', 'REDIS_SUB', 'REDIS_CLIENT'],
})
export class RedisModule {}
