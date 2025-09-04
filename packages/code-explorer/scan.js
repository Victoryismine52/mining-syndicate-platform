import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/**
 * Type: Recursive utility function
 * Location: packages/code-explorer/scan.js > collectFiles
 * Description: Traverses directories to gather source files with JS/TS extensions.
 * Notes: Skips node_modules and hidden folders.
 * EditCounter: 1
 */
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

/**
 * Type: Parser function
 * Location: packages/code-explorer/scan.js > parseFile
 * Description: Parses a source file to extract declared function signatures.
 * Notes: Utilizes the TypeScript compiler API for analysis.
 * EditCounter: 1
 */
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

/**
 * Type: Utility function
 * Location: packages/code-explorer/scan.js > scan
 * Description: Produces parsed function data for all source files in a directory.
 * Notes: Combines collectFiles and parseFile helpers.
 * EditCounter: 1
 */
export function scan(dir) {
  const files = collectFiles(dir);
  return files.map(parseFile);
}
