#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Scanning codebase for asset references...\n');

// Asset reference patterns to scan for
const referencePatterns = [
  // Angular assets
  { pattern: /src="assets\/([^"]+)"/g, context: 'Angular', target: 'dist/app/assets/' },
  { pattern: /src='assets\/([^']+)'/g, context: 'Angular', target: 'dist/app/assets/' },
  { pattern: /background-image:\s*url\(['"]?assets\/([^'"]+)['"]?\)/g, context: 'Angular CSS', target: 'dist/app/assets/' },
  
  // Astro public assets  
  { pattern: /src="\/images\/([^"]+)"/g, context: 'Astro', target: 'dist/images/' },
  { pattern: /src='\/images\/([^']+)'/g, context: 'Astro', target: 'dist/images/' },
  { pattern: /background-image:\s*url\(['"]?\/images\/([^'"]+)['"]?\)/g, context: 'Astro CSS', target: 'dist/images/' },
  
  // API CardTemplates
  { pattern: /CardTemplates[\\\/]([^\\\/\s"',;]+)/g, context: 'API', target: 'api/CardTemplates/' },
  { pattern: /"CardTemplates",\s*"([^"]+)"/g, context: 'API Path.Combine', target: 'api/CardTemplates/' }
];

// File patterns to scan
const filePatterns = [
  'app/src/**/*.ts',
  'app/src/**/*.html', 
  'app/src/**/*.scss',
  'src/**/*.astro',
  'src/**/*.ts',
  'api/**/*.cs'
];

// Get all files to scan
let filesToScan = [];
try {
  for (const pattern of filePatterns) {
    // Use git to find files (respects .gitignore)
    const gitFiles = execSync(`git ls-files "${pattern}"`, { 
      cwd: projectRoot, 
      encoding: 'utf8' 
    }).trim().split('\n').filter(f => f);
    filesToScan.push(...gitFiles);
  }
} catch (error) {
  console.error('❌ Failed to get files to scan:', error.message);
  process.exit(1);
}

// Remove duplicates
filesToScan = [...new Set(filesToScan)];

console.log(`📁 Scanning ${filesToScan.length} files for asset references...\n`);

// Scan files for asset references
const foundReferences = new Map(); // target -> Set of files

for (const filePath of filesToScan) {
  const fullPath = join(projectRoot, filePath);
  
  if (!existsSync(fullPath)) continue;
  
  try {
    const content = readFileSync(fullPath, 'utf8');
    
    for (const { pattern, context, target } of referencePatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(content)) !== null) {
        const assetFile = match[1];
        const fullTarget = target + assetFile;
        
        if (!foundReferences.has(fullTarget)) {
          foundReferences.set(fullTarget, new Set());
        }
        foundReferences.get(fullTarget).add({
          file: filePath,
          context,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️  Failed to read ${filePath}: ${error.message}`);
  }
}

// Report findings
console.log(`📊 Found ${foundReferences.size} unique asset references:\n`);

const referencesByTarget = new Map();
for (const [targetPath, references] of foundReferences) {
  const [targetDir] = targetPath.split('/');
  if (!referencesByTarget.has(targetDir)) {
    referencesByTarget.set(targetDir, []);
  }
  referencesByTarget.get(targetDir).push({
    targetPath,
    references: Array.from(references)
  });
}

// Display references by target
for (const [targetDir, assets] of referencesByTarget) {
  console.log(`📂 ${targetDir.toUpperCase()} (${assets.length} assets):`);
  
  for (const { targetPath, references } of assets) {
    console.log(`   📄 ${targetPath}`);
    for (const ref of references) {
      console.log(`      ├─ ${ref.file}:${ref.line} (${ref.context})`);
    }
  }
  console.log();
}

// Validation phase - check if referenced assets exist in deployment targets
console.log('🔍 Validating asset references against deployment targets...\n');

let validationErrors = [];
let validationSuccess = [];

for (const [targetPath, references] of foundReferences) {
  const fullTargetPath = join(projectRoot, targetPath);
  const exists = existsSync(fullTargetPath);
  
  if (exists) {
    validationSuccess.push({
      targetPath,
      references: Array.from(references)
    });
    console.log(`✅ ${targetPath}`);
  } else {
    validationErrors.push({
      targetPath,
      references: Array.from(references)
    });
    console.error(`❌ ${targetPath}`);
    for (const ref of references) {
      console.error(`   📍 Referenced in: ${ref.file}:${ref.line} (${ref.context})`);
    }
  }
}

// Summary and exit
console.log('\n' + '='.repeat(70));
console.log(`📊 Asset Reference Validation Summary:`);
console.log(`   ✅ Valid references: ${validationSuccess.length}`);
console.log(`   ❌ Missing assets: ${validationErrors.length}`);

if (validationErrors.length > 0) {
  console.error('\n🚨 BUILD FAILED: Missing referenced assets!');
  console.error('💡 Possible solutions:');
  console.error('   1. Run: npm run prebuild (to copy canonical assets)');
  console.error('   2. Run: npm run build (to create deployment targets)');
  console.error('   3. Fix asset references in code');
  console.error('   4. Add missing assets to canonical source (app/src/assets/)');
  
  process.exit(1);
}

console.log('\n✅ All asset references are valid!');
console.log('✅ No missing assets detected in deployment targets');
console.log('✅ Safe to deploy to Cloudflare and Railway');


