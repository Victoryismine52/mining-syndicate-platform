import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const typeMap = {
  feat: 'Features',
  fix: 'Bug Fixes',
  docs: 'Documentation',
  chore: 'Chores',
  refactor: 'Refactors',
  test: 'Tests',
  build: 'Build System',
  ci: 'CI',
  perf: 'Performance',
  style: 'Styles',
  tag: 'Tag Enhancements',
  other: 'Other',
};

function getTags() {
  try {
    const tags = execSync('git tag --sort=creatordate', { encoding: 'utf8' })
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    return tags;
  } catch (err) {
    console.error('Failed to list git tags');
    return [];
  }
}

function getCommits(from, to) {
  const range = from ? `${from}..${to}` : to;
  try {
    const commits = execSync(`git log --format=%s ${range}`, { encoding: 'utf8' })
      .split('\n')
      .map(c => c.trim())
      .filter(Boolean);
    return commits;
  } catch {
    return [];
  }
}

function parseCommit(message) {
  const match = message.match(/^(\w+)(?:\([^)]+\))?:\s*(.+)$/);
  if (match) {
    let type = match[1];
    const description = match[2];
    if (description.toLowerCase().includes('tag')) {
      type = 'tag';
    }
    return { type, description };
  }
  return { type: 'other', description: message };
}

function groupCommits(commits) {
  const groups = {};
  for (const msg of commits) {
    const { type, description } = parseCommit(msg);
    const section = typeMap[type] || type;
    groups[section] = groups[section] || [];
    groups[section].push(description);
  }
  return groups;
}

function buildMarkdown() {
  const tags = getTags();
  const sections = [];
  for (let i = 0; i < tags.length; i++) {
    const to = tags[i];
    const from = tags[i - 1];
    const commits = getCommits(from, to);
    if (commits.length === 0) continue;
    const groups = groupCommits(commits);
    let md = `## ${to}\n\n`;
    for (const [section, items] of Object.entries(groups)) {
      md += `### ${section}\n`;
      for (const item of items) {
        md += `- ${item}\n`;
      }
      md += '\n';
    }
    sections.push(md.trim());
  }
  return sections.join('\n\n');
}

function main() {
  const markdown = buildMarkdown();
  const outFile = process.argv[2];
  if (outFile) {
    writeFileSync(resolve(outFile), markdown);
  } else {
    console.log(markdown);
  }
}

main();
