import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const server = await createServer({
    root: __dirname,
    plugins: [react()],
    server: { port: 3100 },
    appType: 'spa'
  });
  await server.listen();
  console.log('Card builder running at http://localhost:3100');
}

run();
