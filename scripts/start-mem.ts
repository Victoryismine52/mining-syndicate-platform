import { spawn } from 'child_process';
import open from 'open';

// Start the server
const server = spawn(process.platform === 'win32' ? 'node.exe' : 'node', ['server/index.ts'], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
    STORAGE_MODE: 'memory',
    AUTH_DISABLED: 'true',
    PUBLIC_OBJECT_SEARCH_PATHS: '/public'
  },
  stdio: 'inherit'
});

// Wait for server to start then open browser
setTimeout(() => {
  open('http://localhost:5000/sites/');
}, 2000);

// Handle server process
server.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(code ?? 1);
  }
});
