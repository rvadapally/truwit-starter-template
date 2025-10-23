#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📦 Copying assets from canonical source...');

// Define canonical source and target locations
const canonicalSource = join(projectRoot, 'app', 'src', 'assets');
const targets = [
  {
    name: 'Astro (public/images)',
    path: join(projectRoot, 'public', 'images'),
    files: [
      'banner.png',
      'signed_badge.png', 
      'verified-circular-badge.jpg',
      'verified-circular-badge.png',
      'verified-by-truwit.JPG',
      'logo.svg',
      'truwit-logo.png'
    ]
  },
  {
    name: 'API (CardTemplates)', 
    path: join(projectRoot, 'api', 'CardTemplates'),
    files: [
      'banner.png',
      'signed_badge.png',
      'verified-circular-badge.jpg', 
      'verified-circular-badge.png',
      'verified-by-truwit.JPG',
      'logo.svg',
      'truwit-logo.png'
    ]
  }
];

let totalCopied = 0;
let errors = [];

// Copy assets to each target
for (const target of targets) {
  console.log(`\n📁 Copying to ${target.name}...`);
  
  // Ensure target directory exists
  if (!existsSync(target.path)) {
    mkdirSync(target.path, { recursive: true });
    console.log(`   ✅ Created directory: ${target.path}`);
  }
  
  // Copy each required file
  for (const file of target.files) {
    const sourcePath = join(canonicalSource, file);
    const targetPath = join(target.path, file);
    
    try {
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, targetPath);
        console.log(`   ✅ Copied: ${file}`);
        totalCopied++;
      } else {
        const error = `   ❌ Missing canonical file: ${file}`;
        console.error(error);
        errors.push(error);
      }
    } catch (err) {
      const error = `   ❌ Failed to copy ${file}: ${err.message}`;
      console.error(error);
      errors.push(error);
    }
  }
}

// Report results
console.log(`\n📊 Asset Copy Summary:`);
console.log(`   ✅ Total files copied: ${totalCopied}`);
console.log(`   ❌ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.error('\n🚨 Asset copy errors:');
  errors.forEach(error => console.error(error));
  process.exit(1);
}

console.log('\n✅ All canonical assets copied successfully!');
