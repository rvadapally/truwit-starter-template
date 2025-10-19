// Build integration script for Cloudflare Pages
import { copyFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validation helper functions
function validateFileExists(filePath, description) {
  if (!existsSync(filePath)) {
    console.error(`❌ CRITICAL: ${description} does not exist: ${filePath}`);
    process.exit(1);
  }
  console.log(`✅ ${description} exists: ${filePath}`);
}

function validateFileSize(filePath, minSize, description) {
  try {
    const stats = statSync(filePath);
    if (stats.size < minSize) {
      console.error(`❌ CRITICAL: ${description} too small: ${stats.size} bytes (minimum ${minSize})`);
      process.exit(1);
    }
    console.log(`✅ ${description} size OK: ${stats.size} bytes`);
  } catch (error) {
    console.error(`❌ CRITICAL: Cannot read ${description}: ${error.message}`);
    process.exit(1);
  }
}

function validateDistStructure() {
  console.log('🔍 Validating dist/ structure...');
  
  const requiredPaths = [
    { path: 'dist/images/verified-circular-badge.jpg', minSize: 10000, description: 'Astro badge image' },
    { path: 'dist/app/assets/verified-circular-badge.jpg', minSize: 10000, description: 'Angular badge image' },
    { path: 'dist/index.html', minSize: 1000, description: 'Astro homepage' },
    { path: 'dist/app/index.html', minSize: 1000, description: 'Angular app' }
  ];
  
  for (const { path, minSize, description } of requiredPaths) {
    const fullPath = join(__dirname, path);
    validateFileExists(fullPath, description);
    validateFileSize(fullPath, minSize, description);
  }
  
  console.log('✅ All required files present in dist/');
}

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

// BEFORE copying files: Validate source files
console.log('🔍 Validating source files...');
const appDistSrc = join(__dirname, 'app', 'dist', 'humanproof-web');
const badgeSrc = join(__dirname, 'public', 'images', 'verified-circular-badge.jpg');

validateFileExists(appDistSrc, 'Angular build output');
validateFileExists(badgeSrc, 'Badge source file');
validateFileSize(badgeSrc, 10000, 'Badge source file');

console.log('📦 Copying Angular app to dist/app...');
const appDistDest = join(__dirname, 'dist', 'app');

try {
  copyRecursive(appDistSrc, appDistDest);
  console.log('✅ Angular app copied successfully!');
} catch (err) {
  console.error('❌ Error copying Angular app:', err.message);
  process.exit(1);
}

// Copy shared badge image to Angular assets directory
console.log('📦 Copying shared badge to Angular assets...');
const badgeDest = join(__dirname, 'dist', 'app', 'assets', 'verified-circular-badge.jpg');

try {
  mkdirSync(dirname(badgeDest), { recursive: true });
  copyFileSync(badgeSrc, badgeDest);
  console.log('✅ Badge copied to Angular assets successfully!');
} catch (err) {
  console.error('❌ Error copying badge:', err.message);
  process.exit(1);
}

// AFTER copying files: Validate copied files
console.log('🔍 Validating copied files...');
validateFileExists(badgeDest, 'Badge destination file');
validateFileSize(badgeDest, 10000, 'Badge destination file');

// Final validation of dist/ structure
validateDistStructure();
