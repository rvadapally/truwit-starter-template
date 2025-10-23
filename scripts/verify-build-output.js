#!/usr/bin/env node

// Build output verification script - validates that dist/ contains all required files
// after build integration is complete

import { existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Required files that must exist in dist/ after build
const requiredFiles = [
  { path: 'dist/images/verified-circular-badge.jpg', minSize: 10000, description: 'Astro badge image' },
  { path: 'dist/images/verified-by-truwit.JPG', minSize: 10000, description: 'Astro verified badge' },
  { path: 'dist/favicon-truwit.svg', minSize: 100, description: 'Astro favicon' },
  { path: 'dist/app/assets/verified-circular-badge.jpg', minSize: 10000, description: 'Angular badge image' },
  { path: 'dist/app/assets/verified-by-truwit.JPG', minSize: 10000, description: 'Angular verified badge' },
  { path: 'dist/index.html', minSize: 1000, description: 'Astro homepage' },
  { path: 'dist/app/index.html', minSize: 1000, description: 'Angular app' },
];

// Required directories that must exist
const requiredDirs = [
  'dist',
  'dist/images',
  'dist/app',
  'dist/app/assets',
  'dist/_astro'
];

console.log('🔍 Verifying build output structure...\n');

// Check if dist/ directory exists
if (!existsSync(join(projectRoot, 'dist'))) {
  console.error('❌ CRITICAL: dist/ directory does not exist!');
  console.error('   Run: npm run build');
  process.exit(1);
}

// Validate required directories exist
console.log('📁 Checking required directories...');
for (const dir of requiredDirs) {
  const fullPath = join(projectRoot, dir);
  if (!existsSync(fullPath)) {
    console.error(`❌ Missing directory: ${dir}`);
    process.exit(1);
  }
  console.log(`✅ ${dir}/ exists`);
}

// Validate required files exist and meet size requirements
console.log('\n📄 Checking required files...');
let allValid = true;

for (const file of requiredFiles) {
  const fullPath = join(projectRoot, file.path);
  
  if (file.pattern) {
    // Handle pattern matching for files like main.*.js
    const dir = dirname(fullPath);
    const filename = file.path.split('/').pop();
    const pattern = filename.replace('*', '');
    
    try {
      const files = readdirSync(dir);
      const matchingFiles = files.filter(f => f.includes(pattern));
      
      if (matchingFiles.length === 0) {
        console.error(`❌ No files matching pattern: ${file.path}`);
        allValid = false;
        continue;
      }
      
      // Check the first matching file
      const actualFile = join(dir, matchingFiles[0]);
      const stats = statSync(actualFile);
      
      if (stats.size < file.minSize) {
        console.error(`❌ File too small: ${matchingFiles[0]} (${stats.size} bytes, minimum ${file.minSize})`);
        allValid = false;
        continue;
      }
      
      console.log(`✅ ${matchingFiles[0]} - ${stats.size} bytes (${file.description})`);
    } catch (error) {
      console.error(`❌ Error checking pattern ${file.path}:`, error.message);
      allValid = false;
    }
  } else {
    // Handle exact file paths
    if (!existsSync(fullPath)) {
      console.error(`❌ Missing file: ${file.path}`);
      allValid = false;
      continue;
    }
    
    try {
      const stats = statSync(fullPath);
      if (stats.size < file.minSize) {
        console.error(`❌ File too small: ${file.path} (${stats.size} bytes, minimum ${file.minSize})`);
        allValid = false;
        continue;
      }
      
      console.log(`✅ ${file.path} - ${stats.size} bytes (${file.description})`);
    } catch (error) {
      console.error(`❌ Error checking file ${file.path}:`, error.message);
      allValid = false;
    }
  }
}

// Check for critical build artifacts
console.log('\n🔧 Checking build artifacts...');
const criticalArtifacts = [
  { pattern: 'runtime', extension: '.js', description: 'Angular runtime' },
  { pattern: 'polyfills', extension: '.js', description: 'Angular polyfills' },
  { pattern: 'main', extension: '.js', description: 'Angular main bundle' },
  { pattern: 'styles', extension: '.css', description: 'Angular styles' }
];

for (const artifact of criticalArtifacts) {
  const dir = join(projectRoot, 'dist/app');
  
  try {
    const files = readdirSync(dir);
    const matchingFiles = files.filter(f => 
      f.startsWith(artifact.pattern) && f.endsWith(artifact.extension)
    );
    
    if (matchingFiles.length === 0) {
      console.error(`❌ Missing build artifact: ${artifact.pattern}${artifact.extension}`);
      allValid = false;
    } else {
      console.log(`✅ Found ${matchingFiles.length} artifact(s) matching ${artifact.pattern}${artifact.extension} (${artifact.description})`);
      // Log the actual file names for debugging
      matchingFiles.forEach(file => {
        const fullPath = join(dir, file);
        const stats = statSync(fullPath);
        console.log(`   - ${file} (${stats.size} bytes)`);
      });
    }
  } catch (error) {
    console.error(`❌ Error checking artifact ${artifact.pattern}${artifact.extension}:`, error.message);
    allValid = false;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ Build output verification passed!');
  console.log('✅ All required files present in dist/');
  console.log('✅ All files meet minimum size requirements');
  console.log('✅ Ready for deployment');
} else {
  console.log('❌ Build output verification failed!');
  console.log('❌ Fix the issues above before deploying');
  process.exit(1);
}
