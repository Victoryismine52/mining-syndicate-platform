import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';

let server: any;
let agent: request.SuperTest<request.Test>;

beforeAll(async () => {
  process.env.AUTH_DISABLED = 'true';
  process.env.STORAGE_MODE = 'memory';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

  const dbModule = await import('../db');
  (dbModule.db.execute as any) = async () => {};
  (dbModule.pool.end as any) = async () => {};

  const { setSiteStorage } = await import('../site-storage');
  const { memorySiteStorage } = await import('../memory-storage');
  setSiteStorage(memorySiteStorage);

  const routes = await import('../routes');
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  server = await routes.registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  agent = request(`http://127.0.0.1:${port}`);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  delete process.env.STORAGE_MODE;
  delete process.env.AUTH_DISABLED;
});

describe('lead submission rate limiter', () => {
  it('sends rate limit headers and blocks after limit', async () => {
    const first = await agent.post('/api/leads').send({ email: 'a@example.com' });
    expect(first.status).toBe(201);
    expect(first.headers['ratelimit-limit']).toBe('2');
    expect(first.headers['ratelimit-remaining']).toBe('1');

    const second = await agent.post('/api/leads').send({ email: 'b@example.com' });
    expect(second.status).toBe(201);
    expect(second.headers['ratelimit-remaining']).toBe('0');

    const third = await agent.post('/api/leads').send({ email: 'c@example.com' });
    expect(third.status).toBe(429);
    expect(third.headers['ratelimit-remaining']).toBe('0');
  });
});
