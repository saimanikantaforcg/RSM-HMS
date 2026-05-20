/**
 * Jest global test setup — runs before every test file.
 * Sets required environment variables so services that validate
 * env vars at construction time don't throw during unit tests.
 */

// 64-char hex key (32 bytes) — test-only, never used in production
process.env.ENCRYPTION_KEY =
  '0000000000000000000000000000000000000000000000000000000000000000';

process.env.NODE_ENV = 'test';
process.env.USE_REDIS_MOCK = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
process.env.COOKIE_SECRET = 'test-cookie-secret-minimum-32-chars';
