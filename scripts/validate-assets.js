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

// Required assets configuration
const requiredAssets = [
  { path: 'public/images/verified-circular-badge.jpg', minSize: 10000, description: 'Astro badge image' },
  { path: 'public/images/verified-by-truwit.png', minSize: 10000, description: 'Astro verified badge' },
  { path: 'public/favicon-truwit.svg', minSize: 100, description: 'Astro favicon' },
  { path: 'app/src/assets/verified-circular-badge.jpg', minSize: 10000, description: 'Angular badge image' },
  { path: 'app/src/assets/verified-by-truwit.png', minSize: 10000, description: 'Angular verified badge' },
  { path: 'public/images/logo.svg', minSize: 100, description: 'Main logo (organized in images folder)' }
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

// Validate each required asset
console.log('\n📄 Checking required assets...');
let allValid = true;

for (const asset of requiredAssets) {
  const fullPath = join(projectRoot, asset.path);
  const relativePath = asset.path;
  
  console.log(`\n🔍 Validating: ${relativePath}`);
  
  // Check if file exists on filesystem
  if (!existsSync(fullPath)) {
    console.error(`❌ File does not exist: ${relativePath}`);
    allValid = false;
    continue;
  }
  
  // Check if file is tracked by git
  if (!gitTrackedFiles.includes(relativePath)) {
    console.error(`❌ File not tracked by git: ${relativePath}`);
    console.error(`   Run: git add ${relativePath}`);
    allValid = false;
    continue;
  }
  
  // Check file size
  try {
    const stats = statSync(fullPath);
    const fileSize = stats.size;
    
    if (fileSize < asset.minSize) {
      console.error(`❌ File too small: ${relativePath} (${fileSize} bytes, minimum ${asset.minSize})`);
      allValid = false;
      continue;
    }
    
    console.log(`✅ ${relativePath} - ${fileSize} bytes (${asset.description})`);
  } catch (error) {
    console.error(`❌ Failed to get file stats: ${relativePath}`, error.message);
    allValid = false;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All required assets are valid!');
  console.log('✅ All critical directories are tracked');
  console.log('✅ Ready for build');
} else {
  console.log('❌ Asset validation failed!');
  console.log('❌ Fix the issues above before building');
  process.exit(1);
}
