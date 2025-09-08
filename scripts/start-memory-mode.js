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

// Set environment variables for minimal development setup
const env = {
  ...process.env,
  // Core settings
  NODE_ENV: 'development',
  STORAGE_MODE: 'memory',
  AUTH_DISABLED: 'true',
  PORT: process.env.PORT || '5000',
  
  // Minimal paths setup
  PUBLIC_OBJECT_SEARCH_PATHS: '/public',
  BASE_DEV_URL: 'http://0.0.0.0:5000/api',
  
  // Explicitly disable production features
  ENABLE_MONITORING: 'false',
  ENABLE_DETAILED_LOGGING: 'false',
  ENABLE_METRICS: 'false',
  
  // Basic logging only
  LOG_LEVEL: 'info',
  
  // Memory-only settings
  SESSION_SECRET: 'dev-memory-mode-session-secret',
  
  // Clear any production services
  HUBSPOT_API_KEY: '',
  REPLIT_SIDECAR_ENDPOINT: '',
  
  // Clear OAuth settings in memory mode
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_OAUTH_CALLBACK_URL: ''
};

console.log('🔧 Memory Mode Configuration:');
console.log('   Core Settings:');
console.log(`   - STORAGE_MODE: ${env.STORAGE_MODE}`);
console.log(`   - AUTH_DISABLED: ${env.AUTH_DISABLED}`);
console.log(`   - PORT: ${env.PORT}`);
console.log('\n   Features:');
console.log('   - ✓ In-memory storage');
console.log('   - ✓ Authentication bypass');
console.log('   - ✓ Local file storage');
console.log('   - ✓ Seeded admin user');
console.log('   - ✓ Basic console logging');
console.log('   - × Monitoring (disabled)');
console.log('   - × Metrics (disabled)');
console.log('   - × Detailed logging (disabled)');
console.log('   - × External services (disabled)');
console.log('');

// Launch the server
console.log('🔄 Starting server with tsx...');
const serverProcess = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'server/index.ts'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: true
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