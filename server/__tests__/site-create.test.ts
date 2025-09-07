import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import { request as pwRequest, APIRequestContext } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

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

describe('site creation defaults', () => {
  let server: any;
  let context: APIRequestContext;

  beforeEach(async () => {
    process.env.AUTH_DISABLED = 'true';
    process.env.STORAGE_MODE = 'memory';
    process.env.PUBLIC_OBJECT_SEARCH_PATHS = '/public';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

    const dbModule = await import('../db');
    (dbModule.db.execute as any) = async () => {};
    (dbModule.pool.end as any) = async () => {};

    const { setSiteStorage } = await import('../site-storage');
    const { MemorySiteStorage } = await import('../memory-storage');
    setSiteStorage(new MemorySiteStorage());

    const started = await startServer();
    server = started.httpServer;
    context = await pwRequest.newContext({ baseURL: started.baseURL });
  });

  afterEach(async () => {
    await context.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.AUTH_DISABLED;
    delete process.env.STORAGE_MODE;
    delete process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    vi.restoreAllMocks();
  });

  it('adds default slides for standard sites', async () => {
    const res = await context.post('/api/sites', {
      data: { siteId: 'standard-test', name: 'Standard Test', siteType: 'standard' }
    });
    expect(res.status()).toBe(200);

    const { siteStorage } = await import('../site-storage');
    const slides = await siteStorage.getSiteSlides('standard-test');

    const slidesPath = fileURLToPath(new URL('../seeds/slides.json', import.meta.url));
    const expected = JSON.parse(await fs.readFile(slidesPath, 'utf-8'));
    expect(slides).toHaveLength(expected.length);
  });

  it('assigns default forms for pitch sites', async () => {
    const assignments: any[] = [];
    const { storage } = await import('../storage');
    vi.spyOn(storage, 'getFormTemplates').mockResolvedValue([
      { id: 'learn', name: 'Learn More', isBuiltIn: true },
      { id: 'contact', name: 'Contact Sales', isBuiltIn: true },
      { id: 'demo', name: 'Product Demo', isBuiltIn: true }
    ] as any);
    vi.spyOn(storage, 'assignFormToSite').mockImplementation(async (assignment: any) => {
      assignments.push(assignment);
      return { id: String(assignments.length), ...assignment } as any;
    });

    const res = await context.post('/api/sites', {
      data: {
        siteId: 'pitch-test',
        name: 'Pitch Test',
        siteType: 'pitch-site',
        presentationMode: 'configure-now'
      }
    });
    expect(res.status()).toBe(200);
    expect(assignments).toHaveLength(3);
    expect(assignments.map(a => a.formTemplateId)).toEqual(['learn', 'contact', 'demo']);
    expect(assignments[0].cardPosition).toBe('main');
    expect(assignments[2].cardPosition).toBe('sidebar');
  });

  it('creates collective defaults and join card', async () => {
    const assignments: any[] = [];
    const { storage } = await import('../storage');
    vi.spyOn(storage, 'getJoinCardTemplate').mockResolvedValue({ id: 'join', name: 'Join Card', isBuiltIn: true } as any);
    vi.spyOn(storage, 'assignFormToSite').mockImplementation(async (assignment: any) => {
      assignments.push(assignment);
      return { id: '1', ...assignment } as any;
    });

    const res = await context.post('/api/sites', {
      data: {
        siteId: 'collective-test',
        name: 'Collective Test',
        siteType: 'collective',
        presentationMode: 'configure-now'
      }
    });
    expect(res.status()).toBe(200);
    expect(assignments).toHaveLength(1);
    expect(assignments[0].overrideConfig.title).toContain('Collective Test');

    const { siteStorage } = await import('../site-storage');
    const site = await siteStorage.getSite('collective-test');
    const settings = typeof site?.collectiveSettings === 'string'
      ? JSON.parse(site.collectiveSettings as any)
      : site?.collectiveSettings;
    expect(settings.joinType).toBe('public');
    expect(site?.landingConfig.heroTitle).toBe(`Welcome to ${site?.name}`);
  });
});

