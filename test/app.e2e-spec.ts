import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * E2E suite. Requires PostgreSQL and Redis running (pnpm docker:up)
 * plus a valid .env (Firebase credentials included).
 */
describe('Backend Core (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health/live responds 200', () => {
    return request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
  });

  it('GET /api/v1/users without token responds 401 with standard error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(401);

    const body = response.body as {
      success: boolean;
      code: string;
      message: string;
      timestamp: string;
    };
    expect(body.success).toBe(false);
    expect(typeof body.code).toBe('string');
    expect(typeof body.message).toBe('string');
    expect(typeof body.timestamp).toBe('string');
  });

  it('propagates x-request-id back to the client', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('x-request-id', 'e2e-correlation-test');

    expect(response.headers['x-request-id']).toBe('e2e-correlation-test');
  });

  it('GET /api/v1/accounts without token responds 401', () => {
    return request(app.getHttpServer()).get('/api/v1/accounts').expect(401);
  });

  it('GET /api/v1/contacts without token responds 401', () => {
    return request(app.getHttpServer()).get('/api/v1/contacts').expect(401);
  });

  it('GET /api/v1/pipelines without token responds 401', () => {
    return request(app.getHttpServer()).get('/api/v1/pipelines').expect(401);
  });

  it('GET /api/v1/opportunities without token responds 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/opportunities')
      .expect(401);
  });
});
