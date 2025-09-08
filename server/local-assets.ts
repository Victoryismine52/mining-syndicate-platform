import fs from 'fs';
import path from 'path';

export function ensureLocalAssetsDir(): string {
  const tryPaths = [
    path.resolve(process.cwd(), '..', 'ms-assets'),
    path.resolve(process.cwd(), 'local-assets'),
  ];

  for (const p of tryPaths) {
    try {
      fs.mkdirSync(p, { recursive: true });
      return p;
    } catch (_err) {
      // Try next
    }
  }
  // Fallback to cwd if all else fails
  const fallback = path.resolve(process.cwd(), 'local-assets');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

