import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { scan } from './scan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const data = scan(targetDir);

async function run() {
  const server = await createServer({
    root: __dirname,
    plugins: [
      react(),
      {
        name: 'api-data',
        configureServer(server) {
          server.middlewares.use('/api/data', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          });
        }
      }
    ],
    server: { port: 3200 },
    appType: 'spa'
  });
  await server.listen();
  console.log('Code explorer running at http://localhost:3200');
}

run();
