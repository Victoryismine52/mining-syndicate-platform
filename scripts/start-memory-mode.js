#!/usr/bin/env node

/**
 * Enhanced dev:mem launcher script 
 * - Handles environment setup
 * - Launches server with memory storage and auth bypass
 * - Auto-opens browser to test the functionality
 * - Provides stable dev environment for rapid prototyping
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Starting Memory Mode Development Server...');
console.log('');

// Check for required files
const requiredFiles = [
  'server/data/seed.json',
  'server/memory-storage.ts',
  'server/index.ts'
];

for (const file of requiredFiles) {
  const filePath = join(projectRoot, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✅ Required files found');

// Set environment variables
const env = {
  ...process.env,
  NODE_ENV: 'development',
  STORAGE_MODE: 'memory',
  AUTH_DISABLED: 'true',
  PUBLIC_OBJECT_SEARCH_PATHS: '/public',
  LOG_LEVEL: 'info'
};

console.log('🔧 Environment Configuration:');
console.log(`   STORAGE_MODE: ${env.STORAGE_MODE}`);
console.log(`   AUTH_DISABLED: ${env.AUTH_DISABLED}`);
console.log(`   PUBLIC_OBJECT_SEARCH_PATHS: ${env.PUBLIC_OBJECT_SEARCH_PATHS}`);
console.log('');

// Launch the server
console.log('🔄 Starting server with tsx...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('close', (code) => {
  console.log(`\n📊 Server process exited with code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Wait a moment then try to open browser
setTimeout(() => {
  console.log('');
  console.log('🌐 Server should be running at http://localhost:5000');
  console.log('📝 Memory storage mode with seeded data loaded');
  console.log('🔓 Authentication bypassed for rapid development');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
}, 2000);