
const { spawn } = require('child_process');

console.log('🚀 Starting development environment...');

// Start the main application
const mainApp = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { 
    ...process.env,
    PORT: '5000',
    NODE_ENV: 'development'
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development environment...');
  mainApp.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development environment...');
  mainApp.kill('SIGTERM');
  process.exit(0);
});

mainApp.on('close', (code) => {
  console.log(`Main application exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting in 3 seconds...');
    setTimeout(() => {
      console.log('🚀 Restarting application...');
      const newProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        env: { 
          ...process.env,
          PORT: '5000',
          NODE_ENV: 'development'
        }
      });
      
      newProcess.on('close', (restartCode) => {
        if (restartCode !== 0) {
          console.log('❌ Application failed to restart');
          process.exit(1);
        }
      });
    }, 3000);
  }
});

console.log('✅ Development environment started on port 5000');
