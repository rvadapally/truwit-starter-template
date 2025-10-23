#!/usr/bin/env node

// Asset validation script - validates that all required static assets are:
// 1. Tracked in git
// 2. Not in gitignored directories  
// 3. Actually exist on filesystem
// 4. Meet minimum file size requirements

import { readFileSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Canonical source assets (single source of truth)
const canonicalAssets = [
  { path: 'app/src/assets/banner.png', minSize: 50000, description: 'Banner logo for navbars' },
  { path: 'app/src/assets/verified-circular-badge.png', minSize: 100000, description: 'Circular badge PNG' },
  { path: 'app/src/assets/signed_badge.png', minSize: 100000, description: 'Signed badge icon' },
  { path: 'app/src/assets/verified-by-truwit.JPG', minSize: 50000, description: 'Verified by TruWit badge JPG' },
  { path: 'app/src/assets/verified-circular-badge.jpg', minSize: 50000, description: 'Circular badge JPG' },
  { path: 'app/src/assets/logo.svg', minSize: 500, description: 'TruWit logo SVG' },
  { path: 'app/src/assets/truwit-logo.png', minSize: 50000, description: 'TruWit logo PNG' }
];

// Target locations (copied from canonical source during build)
const targetAssets = [
  // Astro public assets
  { path: 'public/images/banner.png', minSize: 50000, description: 'Banner for Astro navbar', optional: false },
  { path: 'public/images/signed_badge.png', minSize: 100000, description: 'Signed badge for Astro pages', optional: false },
  { path: 'public/images/verified-circular-badge.jpg', minSize: 50000, description: 'Circular badge for Astro footer', optional: false },
  
  // API CardTemplates
  { path: 'api/CardTemplates/verified-by-truwit.JPG', minSize: 50000, description: 'API template asset', optional: false },
  { path: 'api/CardTemplates/verified-circular-badge.jpg', minSize: 50000, description: 'API template asset', optional: false },
  { path: 'api/CardTemplates/proof-card.svg', minSize: 1000, description: 'API SVG template', optional: false }
];

// Critical directories that should NOT be gitignored
const criticalDirs = ['public', 'src', 'app/src'];

console.log('🔍 Validating required assets...\n');

// Get list of files tracked by git
let gitTrackedFiles;
try {
  gitTrackedFiles = execSync('git ls-files', { cwd: projectRoot, encoding: 'utf8' }).split('\n');
} catch (error) {
  console.error('❌ Failed to get git tracked files:', error.message);
  process.exit(1);
}

// Read .gitignore content
let gitignoreContent;
try {
  gitignoreContent = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
} catch (error) {
  console.error('❌ Failed to read .gitignore:', error.message);
  process.exit(1);
}

// Validate critical directories aren't gitignored
console.log('📁 Checking critical directories...');
for (const dir of criticalDirs) {
  const ignorePattern = new RegExp(`^${dir}\\s*$`, 'm');
  if (ignorePattern.test(gitignoreContent)) {
    console.error(`❌ CRITICAL: ${dir}/ is gitignored but should be tracked!`);
    console.error(`   Remove "${dir}" from .gitignore`);
    process.exit(1);
  }
  console.log(`✅ ${dir}/ is not gitignored`);
}

// Validate canonical source assets (single source of truth)
console.log('\n📄 Checking canonical source assets...');
let allValid = true;

for (const asset of canonicalAssets) {
  const fullPath = join(projectRoot, asset.path);
  const relativePath = asset.path;
  
  console.log(`\n🔍 Validating canonical: ${relativePath}`);
  
  // Check if file exists on filesystem
  if (!existsSync(fullPath)) {
    console.error(`❌ Canonical file does not exist: ${relativePath}`);
    allValid = false;
    continue;
  }
  
  // Check if file is tracked by git
  if (!gitTrackedFiles.includes(relativePath)) {
    console.error(`❌ Canonical file not tracked by git: ${relativePath}`);
    console.error(`   Run: git add ${relativePath}`);
    allValid = false;
    continue;
  }
  
  // Check file size
  try {
    const stats = statSync(fullPath);
    const fileSize = stats.size;
    
    if (fileSize < asset.minSize) {
      console.error(`❌ Canonical file too small: ${relativePath} (${fileSize} bytes, minimum ${asset.minSize})`);
      allValid = false;
      continue;
    }
    
    console.log(`✅ ${relativePath} - ${fileSize} bytes (${asset.description})`);
  } catch (error) {
    console.error(`❌ Failed to get canonical file stats: ${relativePath}`, error.message);
    allValid = false;
  }
}

// Validate target assets (copied during build)
console.log('\n📄 Checking target assets (build outputs)...');

for (const asset of targetAssets) {
  const fullPath = join(projectRoot, asset.path);
  const relativePath = asset.path;
  
  console.log(`\n🔍 Validating target: ${relativePath}`);
  
  // Check if file exists on filesystem
  if (!existsSync(fullPath)) {
    if (!asset.optional) {
      console.error(`❌ Target file does not exist: ${relativePath}`);
      console.error(`   Run: npm run prebuild to copy from canonical source`);
      allValid = false;
    } else {
      console.log(`⚠️  Optional target file missing: ${relativePath}`);
    }
    continue;
  }
  
  // Check file size
  try {
    const stats = statSync(fullPath);
    const fileSize = stats.size;
    
    if (fileSize < asset.minSize) {
      console.error(`❌ Target file too small: ${relativePath} (${fileSize} bytes, minimum ${asset.minSize})`);
      allValid = false;
      continue;
    }
    
    console.log(`✅ ${relativePath} - ${fileSize} bytes (${asset.description})`);
  } catch (error) {
    console.error(`❌ Failed to get target file stats: ${relativePath}`, error.message);
    allValid = false;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('✅ All canonical source assets are valid!');
  console.log('✅ All target assets are properly copied!');
  console.log('✅ All critical directories are tracked');
  console.log('✅ Asset consolidation successful - ready for build');
} else {
  console.log('❌ Asset validation failed!');
  console.log('❌ Fix the issues above before building');
  console.log('💡 Try running: npm run prebuild');
  process.exit(1);
}
