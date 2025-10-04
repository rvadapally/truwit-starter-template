// Build integration script for Cloudflare Pages
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy Angular build to Astro dist
function copyRecursive(src, dest) {
  try {
    mkdirSync(dest, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      try {
        copyFileSync(srcPath, destPath);
        console.log(`Copied: ${entry.name}`);
      } catch (err) {
        console.error(`Error copying ${entry.name}:`, err.message);
      }
    }
  }
}

console.log('📦 Copying Angular app to dist/app...');
const appDistSrc = join(__dirname, 'app', 'dist', 'humanproof-web');
const appDistDest = join(__dirname, 'dist', 'app');

try {
  copyRecursive(appDistSrc, appDistDest);
  console.log('✅ Angular app copied successfully!');
} catch (err) {
  console.error('❌ Error copying Angular app:', err.message);
  process.exit(1);
}
