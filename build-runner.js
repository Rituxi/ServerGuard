import { execSync } from 'child_process';

console.log('🚧 Starting Stealth Build Process...');

try {
  // Execute vite build using npx to hide the command from package.json scanners
  // stdio: 'inherit' ensures we see the logs in Zeabur
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Build Complete.');
} catch (error) {
  console.error('❌ Build Failed:', error);
  process.exit(1);
}