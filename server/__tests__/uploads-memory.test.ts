import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { request as pwRequest, APIRequestContext } from 'playwright';

async function startServer() {
  const routes = await import('../routes');
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const httpServer = await routes.registerRoutes(app);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as any).port;
  return { httpServer, baseURL: `http://127.0.0.1:${port}` };
}

describe('memory upload routing', () => {
  let server: any;
  let context: APIRequestContext;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
    process.env.AUTH_DISABLED = 'true';
    process.env.STORAGE_MODE = 'memory';
    const dbModule = await import('../db');
    (dbModule.db.execute as any) = async () => {};
    (dbModule.pool.end as any) = async () => {};
    const { setSiteStorage } = await import('../site-storage');
    const { memorySiteStorage } = await import('../memory-storage');
    setSiteStorage(memorySiteStorage);
    const started = await startServer();
    server = started.httpServer;
    context = await pwRequest.newContext({ baseURL: started.baseURL });
  });
  afterAll(async () => {
    await context.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.STORAGE_MODE;
  });

  it('stores and retrieves uploaded assets', async () => {
    const data = Buffer.from('hello');
    const putRes = await context.put('/uploads/test.txt', { data });
    expect(putRes.status()).toBe(201);
    const getRes = await context.get('/uploads/test.txt');
    expect(getRes.status()).toBe(200);
    const text = await getRes.text();
    expect(text).toBe('hello');
  });
});
