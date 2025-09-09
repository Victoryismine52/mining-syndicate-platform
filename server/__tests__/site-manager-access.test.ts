import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Avoid pulling in real pino logger during tests
vi.mock('../logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

// This test covers the scenario where a site manager invite exists before
// the user has an account. Once the user signs up (via upsertUser),
// checkSiteAccess should treat them as a manager and allow site operations.

const SITE_ID = 'access-site';
const managerEmail = 'precreated-manager@example.com';

let checkSiteAccess: any;

// Minimal mock of storage with upsertUser to simulate login/creation
vi.mock('../storage', () => {
  return {
    storage: {
      upsertUser: vi.fn(async (data: any) => ({ id: '1', role: 'generic', isAdmin: false, ...data })),
    },
  };
});

describe('site manager access after account creation', () => {
  beforeEach(async () => {
    process.env.AUTH_DISABLED = 'true';
    process.env.STORAGE_MODE = 'memory';
    process.env.PUBLIC_OBJECT_SEARCH_PATHS = '/public';
    process.env.DATABASE_URL = process.env.DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/postgres';

    const { setSiteStorage } = await import('../site-storage');
    const { MemorySiteStorage } = await import('../memory-storage');
    setSiteStorage(new MemorySiteStorage());

    const { siteStorage } = await import('../site-storage');
    await siteStorage.createSite({ siteId: SITE_ID, name: 'Test', siteType: 'standard' } as any);
    // Pre-create a site_managers entry for an email with no user account yet
    await siteStorage.addSiteManager(SITE_ID, managerEmail);

    // Import after env setup to avoid config failures
    ({ checkSiteAccess } = await import('../site-access-control'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.AUTH_DISABLED;
    delete process.env.STORAGE_MODE;
    delete process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    delete process.env.DATABASE_URL;
  });

  it('grants management access after user logs in', async () => {
    const { storage } = await import('../storage');
    // Simulate user creation/login which should match the pre-created site manager
    const user = await storage.upsertUser({
      email: managerEmail,
      firstName: 'Site',
      lastName: 'Manager',
    });

    const req: any = { params: { siteId: SITE_ID }, user };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await checkSiteAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.siteAccess).toMatchObject({ canManage: true, isAdmin: false, isSiteManager: true });
  });
});

