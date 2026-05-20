import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Clinical Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Set mandatory env vars for testing
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.COOKIE_SECRET = 'test-cookie-secret';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_NAME = ':memory:';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); // CRITICAL: MUST MATCH main.ts
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check (Smoke Test)', () => {
    it('/api/v1/health (GET) should return 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('ok');
        });
    });
  });

  describe('Authentication (Critical Path)', () => {
    it('/api/v1/auth/login (POST) should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@hms.local', password: 'wrongpassword' })
        .expect(401);
    });
  });
});
