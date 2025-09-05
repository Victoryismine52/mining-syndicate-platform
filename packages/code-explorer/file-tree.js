import fs from 'fs';
import path from 'path';

/**
{
  "friendlyName": "build file tree",
  "description": "Builds an object representing the directory structure of a path.",
  "editCount": 2,
  "tags": [],
  "location": "packages/code-explorer/file-tree.js > buildFileTree",
  "notes": "Skips .git and node_modules folders during traversal."
}
*/
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
