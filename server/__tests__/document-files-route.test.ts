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

describe('document-files route', () => {
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

    const { objectStorageClient } = await import('../objectStorage');
    await objectStorageClient
      .bucket('documents')
      .file('test.pdf')
      .save('dummy', { contentType: 'application/pdf' });

    const started = await startServer();
    server = started.httpServer;
    context = await pwRequest.newContext({ baseURL: started.baseURL });
  });

  afterAll(async () => {
    await context.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.STORAGE_MODE;
  });

  it('serves a document with correct headers', async () => {
    const res = await context.get('/document-files/documents/test.pdf');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/pdf');
    expect(res.headers()['access-control-allow-origin']).toBe('*');
    expect(res.headers()['cache-control']).toBe('public, max-age=3600');
  });
});
