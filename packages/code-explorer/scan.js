import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/**
{
  "friendlyName": "collect files",
  "description": "Traverses directories to gather source files with JS/TS extensions.",
  "editCount": 2,
  "tags": [],
  "location": "packages/code-explorer/scan.js > collectFiles",
  "notes": "Skips node_modules and hidden folders."
}
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
{
  "friendlyName": "parse file",
  "description": "Parses a source file to extract declared function signatures.",
  "editCount": 2,
  "tags": [],
  "location": "packages/code-explorer/scan.js > parseFile",
  "notes": "Utilizes the TypeScript compiler API for analysis."
}
*/
function parseFile(file, rootDir) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
  const functions = [];

  function addFunction(
    name,
    params,
    returnType,
    jsDocNode,
    isAsync = false,
    isGenerator = false,
  ) {
    const tags = ts
      .getJSDocTags(jsDocNode)
      .filter((t) => t.tagName.getText(sourceFile) === 'tag')
      .map((t) => (t.comment ?? '').toString());
    functions.push({
      name,
      signature: `${isAsync ? 'async ' : ''}${isGenerator ? '*' : ''}${name}(${params}): ${returnType}`,
      path: path.relative(rootDir, file),
      tags,
    });
  }

  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const paramsText = node.parameters
        .map((p) => p.getText(sourceFile))
        .join(', ');
      const returnType = node.type ? node.type.getText(sourceFile) : 'any';
      const isAsync = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
      const isGenerator = !!node.asteriskToken;
      addFunction(node.name.text, paramsText, returnType, node, isAsync, isGenerator);
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      (ts.isFunctionExpression(node.initializer) ||
        ts.isArrowFunction(node.initializer))
    ) {
      const init = node.initializer;
      const paramsText = init.parameters
        .map((p) => p.getText(sourceFile))
        .join(', ');
      const returnType = init.type ? init.type.getText(sourceFile) : 'any';
      const isAsync = init.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
      const isGenerator = ts.isFunctionExpression(init) && !!init.asteriskToken;
      addFunction(
        node.name.text,
        paramsText,
        returnType,
        node,
        isAsync,
        isGenerator,
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functions;
}

/**
{
  "friendlyName": "scan directory",
  "description": "Produces parsed function data for all source files in a directory.",
  "editCount": 2,
  "tags": [],
  "location": "packages/code-explorer/scan.js > scan",
  "notes": "Combines collectFiles and parseFile helpers."
}
*/
export function scan(dir, options = {}) {
  const files = collectFiles(dir);
  const results = files.flatMap((f) => parseFile(f, dir));
  if (options.tag) {
    return results.filter((fn) => fn.tags.includes(options.tag));
  }
  return results;
}

/**
{
  "friendlyName": "scan to json",
  "description": "Serializes scan results to formatted JSON.",
  "editCount": 1,
  "tags": [],
  "location": "packages/code-explorer/scan.js > scanToJSON",
  "notes": "Wraps scan with JSON.stringify."
}
*/
export function scanToJSON(dir) {
  return JSON.stringify(scan(dir), null, 2);
}
