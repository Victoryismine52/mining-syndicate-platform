import fs from 'fs';
import path from 'path';

export function buildFileTree(dir) {
  const name = path.basename(dir);
  const item = { name, path: dir };
  const stats = fs.statSync(dir);
  if (stats.isDirectory()) {
    item.children = fs
      .readdirSync(dir)
      .filter((e) => e !== '.git' && e !== 'node_modules')
      .map((e) => buildFileTree(path.join(dir, e)));
  }
  return item;
}
