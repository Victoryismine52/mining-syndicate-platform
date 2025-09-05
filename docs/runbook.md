# Runbook

## Generate changelog

Use the changelog script to create Markdown release notes from conventional commit messages.

```bash
node packages/code-explorer/scripts/generate-changelog.js CHANGELOG.md
```

The script inspects git tags in chronological order, groups commits by type, and writes the resulting changelog to the specified file. If no file path is provided, the output is printed to standard output.
