import { defineConfig } from '@playwright/experimental-ct-react';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './',
  testMatch: [
    'packages/code-explorer/e2e/**/*.spec.ts',
    'packages/card-builder/src/__tests__/**/*.spec.{ts,tsx}',
  ],
  ctViteConfig: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@uiw/react-codemirror': path.resolve(
          __dirname,
          './packages/code-explorer/test-stubs/codemirror.tsx'
        ),
        diff: path.resolve(__dirname, './packages/code-explorer/test-stubs/diff.ts'),
        '@codemirror/lang-javascript': path.resolve(
          __dirname,
          './packages/code-explorer/test-stubs/lang-javascript.ts'
        ),
        '@codemirror/lang-json': path.resolve(
          __dirname,
          './packages/code-explorer/test-stubs/lang-json.ts'
        ),
        '@codemirror/lang-css': path.resolve(
          __dirname,
          './packages/code-explorer/test-stubs/lang-css.ts'
        ),
        '@codemirror/lang-html': path.resolve(
          __dirname,
          './packages/code-explorer/test-stubs/lang-html.ts'
        ),
        'react-virtualized': path.resolve(
          __dirname,
          './packages/code-explorer/test-stubs/react-virtualized.tsx'
        ),
      },
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
