import fs from 'fs';
import path from 'path';
import ts from 'typescript';

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collectFiles(full, files);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function parseFile(file) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
  const functions = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.push({
        name: node.name.text,
        params: node.parameters.map(p => p.name.getText()),
        returnType: node.type ? node.type.getText() : 'any'
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { file, functions };
}

export function scan(dir) {
  const files = collectFiles(dir);
  return files.map(parseFile);
}
