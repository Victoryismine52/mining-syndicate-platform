import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import { request as pwRequest, APIRequestContext } from 'playwright';

const SITE_SLUG = 'invite-site';
const usersData: any[] = [];

vi.mock('../db', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn(async () => {
          const { siteStorage } = await import('../site-storage');
          const managers = await siteStorage.getSiteManagers(SITE_SLUG);
          return managers.map((m: any) => ({
            id: m.id,
            siteId: m.siteId,
            userEmail: m.userEmail,
            createdAt: m.createdAt,
            existingEmail: usersData.find(u => u.email === m.userEmail)?.email,
          }));
        }),
      })),
      execute: vi.fn(),
    },
    pool: { end: vi.fn() },
  };
});

vi.mock('../storage', async () => {
  const actual = await vi.importActual<any>('../storage');
  return {
    ...actual,
    storage: {
      ...actual.storage,
      createUser: vi.fn(async (user: any) => {
        const newUser = { id: String(usersData.length + 1), ...user };
        usersData.push(newUser);
        return newUser;
      }),
      getAllUsers: vi.fn(async () => usersData),
    },
  };
});

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

describe('site manager invites', () => {
  let server: any;
  let context: APIRequestContext;

  beforeEach(async () => {
    process.env.AUTH_DISABLED = 'true';
    process.env.STORAGE_MODE = 'memory';
    process.env.PUBLIC_OBJECT_SEARCH_PATHS = '/public';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

    const { setSiteStorage } = await import('../site-storage');
    const { MemorySiteStorage } = await import('../memory-storage');
    setSiteStorage(new MemorySiteStorage());

    const started = await startServer();
    server = started.httpServer;
    context = await pwRequest.newContext({ baseURL: started.baseURL });

    const { siteStorage } = await import('../site-storage');
    await siteStorage.createSite({ siteId: SITE_SLUG, name: 'Test', siteType: 'standard' } as any);
  });

  afterEach(async () => {
    await context.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.AUTH_DISABLED;
    delete process.env.STORAGE_MODE;
    delete process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    usersData.length = 0;
    vi.restoreAllMocks();
  });

  it('reflects account existence in manager listing', async () => {
    const inviteEmail = 'invitee@example.com';
    const res = await context.post(`/api/sites/${SITE_SLUG}/managers`, {
      data: { userEmail: inviteEmail },
    });
    expect(res.status()).toBe(200);

    let getRes = await context.get(`/api/sites/${SITE_SLUG}/managers`);
    expect(getRes.status()).toBe(200);
    let managers = await getRes.json();
    expect(managers[0]).toMatchObject({ userEmail: inviteEmail, hasAccount: false });

    const { storage } = await import('../storage');
    await storage.createUser({ email: inviteEmail, firstName: 'A', lastName: 'B' });

    getRes = await context.get(`/api/sites/${SITE_SLUG}/managers`);
    managers = await getRes.json();
    expect(managers[0]).toMatchObject({ userEmail: inviteEmail, hasAccount: true });
  });
});
