#!/usr/bin/env node
import { execSync } from 'child_process';

function getStagedFiles() {
  const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  return output.split('\n').map(f => f.trim()).filter(Boolean);
}

const userName = execSync('git config user.name', { encoding: 'utf8' }).trim();
const sanitizedName = userName.replace(/\s+/g, '_');
const profileRegex = new RegExp(`.*-${sanitizedName}\\.md$`);

const stagedFiles = getStagedFiles();
const touchesCodeExplorer = stagedFiles.some(f => f.startsWith('packages/code-explorer/src'));
const touchesTests = stagedFiles.some(f => f.includes('__tests__'));

if (!touchesCodeExplorer && !touchesTests) {
  process.exit(0);
}

const hasProfileUpdate = stagedFiles.some(f => profileRegex.test(f));

if (!hasProfileUpdate) {
  console.error(
    `Error: commits touching packages/code-explorer/src or __tests__ must include a *-${sanitizedName}.md profile update.`
  );
  process.exit(1);
}
