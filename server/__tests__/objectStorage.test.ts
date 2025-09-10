import { describe, it, expect, vi, afterEach } from 'vitest';
import { Storage } from '@google-cloud/storage';

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
process.env.AUTH_DISABLED = 'true';

afterEach(() => {
  delete process.env.REPLIT_SIDECAR_ENDPOINT;
  delete process.env.PRIVATE_OBJECT_DIR;
  delete process.env.STORAGE_MODE;
  vi.resetModules();
});

describe('objectStorage client selection', () => {
  it('uses google storage when REPLIT_SIDECAR_ENDPOINT is set', async () => {
    process.env.REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';
    const mod = await import('../objectStorage');
    expect(mod.objectStorageClient).toBeInstanceOf(Storage);
  });

  it('uses memory storage when REPLIT_SIDECAR_ENDPOINT is absent', async () => {
    process.env.PRIVATE_OBJECT_DIR = '/bucket';
    const mod = await import('../objectStorage');
    expect(mod.objectStorageClient.constructor.name).toBe('MemoryStorage');
    const service = new mod.ObjectStorageService();
    const url = await service.getSlideUploadURL();
    expect(url).toMatch(/\/bucket\/slides\//);
  });

  it('uses memory storage when STORAGE_MODE is memory', async () => {
    process.env.REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';
    process.env.STORAGE_MODE = 'memory';
    process.env.PRIVATE_OBJECT_DIR = '/bucket';
    const mod = await import('../objectStorage');
    expect(mod.objectStorageClient.constructor.name).toBe('MemoryStorage');
  });
});
