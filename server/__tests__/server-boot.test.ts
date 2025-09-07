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

describe('server boot', () => {
  describe('memory storage', () => {
    let server: any;
    let context: APIRequestContext;
    beforeAll(async () => {
      process.env.DATABASE_URL =
        process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
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
    it('responds to health and persists leads', async () => {
      const health = await context.get('/api/health');
      expect(health.status()).toBe(200);
      const leadRes = await context.post('/api/leads', { data: { email: 'mem@example.com' } });
      expect(leadRes.status()).toBe(201);
      const { siteStorage } = await import('../site-storage');
      const leads = await siteStorage.getSiteLeads('main-site');
      expect(leads.some((l) => l.email === 'mem@example.com')).toBe(true);
    });
  });

  describe('postgres storage', () => {
    let server: any;
    let context: APIRequestContext | undefined;
    let ready = true;
    beforeAll(async () => {
      process.env.AUTH_DISABLED = 'true';
      delete process.env.STORAGE_MODE;
      process.env.TEST_DATABASE_URL =
        process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
      try {
        const started = await startServer();
        server = started.httpServer;
        context = await pwRequest.newContext({ baseURL: started.baseURL });
        const health = await context.get('/api/health');
        if (health.status() !== 200) {
          ready = false;
        }
      } catch {
        ready = false;
      }
    });
    afterAll(async () => {
      await context?.dispose();
      await new Promise<void>((resolve) => server?.close(() => resolve()));
    });
    const run = ready ? it : it.skip;
    run('responds to health and persists leads', async () => {
      const health = await context!.get('/api/health');
      expect(health.status()).toBe(200);
      const leadRes = await context!.post('/api/leads', { data: { email: 'pg@example.com' } });
      expect(leadRes.status()).toBe(201);
      const { siteStorage } = await import('../site-storage');
      const leads = await siteStorage.getSiteLeads('main-site');
      expect(leads.some((l) => l.email === 'pg@example.com')).toBe(true);
    });
  });
});

