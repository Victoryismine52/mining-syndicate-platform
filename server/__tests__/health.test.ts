import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;
let pool: { end: () => Promise<void> };

beforeAll(async () => {
  process.env.AUTH_DISABLED = 'true';
  process.env.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

  const routes = await import('../routes');
  const db = await import('../db');

  app = express();
  await routes.registerRoutes(app);
  pool = db.pool;
});

afterAll(async () => {
  await pool.end();
});

describe('health endpoint', () => {
  it('returns ok when database reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
