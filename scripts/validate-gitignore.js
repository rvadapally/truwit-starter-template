#!/usr/bin/env node

// .gitignore validation script - ensures critical directories aren't gitignored

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Critical directories that should NOT be gitignored
const criticalDirs = [
  { dir: 'public', reason: 'Astro static assets directory' },
  { dir: 'src', reason: 'Astro source code directory' },
  { dir: 'app/src', reason: 'Angular source code directory' },
  { dir: 'app/src/assets', reason: 'Angular assets directory' }
];

// Patterns that should NOT be in .gitignore for this project
const forbiddenPatterns = [
  { pattern: '^public\\s*$', reason: 'public/ directory must be tracked for Astro' },
  { pattern: '^src\\s*$', reason: 'src/ directory must be tracked for Astro' },
  { pattern: '^app/src\\s*$', reason: 'app/src/ directory must be tracked for Angular' },
  { pattern: '^app/src/assets\\s*$', reason: 'app/src/assets/ directory must be tracked for Angular' }
];

console.log('🔍 Validating .gitignore configuration...\n');

// Read .gitignore content
let gitignoreContent;
try {
  gitignoreContent = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
} catch (error) {
  console.error('❌ Failed to read .gitignore:', error.message);
  process.exit(1);
}

// Check critical directories aren't gitignored
console.log('📁 Checking critical directories...');
let allValid = true;

for (const { dir, reason } of criticalDirs) {
  const ignorePattern = new RegExp(`^${dir.replace('/', '\\/')}\\s*$`, 'm');
  
  if (ignorePattern.test(gitignoreContent)) {
    console.error(`❌ CRITICAL: ${dir}/ is gitignored but should be tracked!`);
    console.error(`   Reason: ${reason}`);
    console.error(`   Action: Remove "${dir}" from .gitignore`);
    allValid = false;
  } else {
    console.log(`✅ ${dir}/ is not gitignored (${reason})`);
  }
}

// Check for forbidden patterns
console.log('\n🚫 Checking for forbidden patterns...');
for (const { pattern, reason } of forbiddenPatterns) {
  const regex = new RegExp(pattern, 'm');
  
  if (regex.test(gitignoreContent)) {
    console.error(`❌ FORBIDDEN PATTERN FOUND: ${pattern}`);
    console.error(`   Reason: ${reason}`);
    allValid = false;
  } else {
    console.log(`✅ Pattern ${pattern} not found`);
  }
}

// Check for common mistakes
console.log('\n⚠️  Checking for common mistakes...');
const commonMistakes = [
  { pattern: 'public/', description: 'Should be "public" (without trailing slash)' },
  { pattern: 'src/', description: 'Should be "src" (without trailing slash)' },
  { pattern: 'app/src/', description: 'Should be "app/src" (without trailing slash)' }
];

for (const { pattern, description } of commonMistakes) {
  const regex = new RegExp(`^${pattern.replace('/', '\\/')}\\s*$`, 'm');
  
  if (regex.test(gitignoreContent)) {
    console.log(`⚠️  WARNING: Found "${pattern}" - ${description}`);
    console.log(`   Consider using "${pattern.slice(0, -1)}" instead`);
  }
}

// Validate required patterns are present
console.log('\n✅ Checking required ignore patterns...');
const requiredPatterns = [
  { pattern: '^dist\\s*$', description: 'Build output directory' },
  { pattern: '^node_modules\\s*$', description: 'Dependencies' },
  { pattern: '^\\.astro\\s*$', description: 'Astro cache' },
  { pattern: '^app/dist\\s*$', description: 'Angular build output' }
];

for (const { pattern, description } of requiredPatterns) {
  const regex = new RegExp(pattern, 'm');
  
  if (regex.test(gitignoreContent)) {
    console.log(`✅ Found required pattern: ${pattern} (${description})`);
  } else {
    console.log(`⚠️  Missing recommended pattern: ${pattern} (${description})`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ .gitignore validation passed!');
  console.log('✅ All critical directories are tracked');
  console.log('✅ No forbidden patterns found');
  console.log('✅ Ready for development');
} else {
  console.log('❌ .gitignore validation failed!');
  console.log('❌ Fix the issues above before continuing');
  console.log('❌ Critical directories must be tracked for proper deployment');
  process.exit(1);
}
