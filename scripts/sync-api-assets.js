#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔄 Syncing canonical assets to API CardTemplates...');

// Define source and target
const canonicalSource = join(projectRoot, 'app', 'src', 'assets');
const apiCardTemplates = join(projectRoot, 'api', 'CardTemplates');

// Files that need to be synced to API CardTemplates
const filesToSync = [
  'banner.png',
  'signed_badge.png',
  'verified-circular-badge.jpg',
  'verified-circular-badge.png', 
  'verified-by-truwit.JPG',
  'logo.svg',
  'truwit-logo.png'
];

// Ensure CardTemplates directory exists
if (!existsSync(apiCardTemplates)) {
  mkdirSync(apiCardTemplates, { recursive: true });
  console.log(`✅ Created directory: ${apiCardTemplates}`);
}

let synced = 0;
let errors = [];

// Copy each file from canonical source to API CardTemplates
for (const file of filesToSync) {
  const sourcePath = join(canonicalSource, file);
  const targetPath = join(apiCardTemplates, file);
  
  try {
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, targetPath);
      console.log(`✅ Synced: ${file}`);
      synced++;
    } else {
      const error = `❌ Missing canonical file: ${file}`;
      console.error(error);
      errors.push(error);
    }
  } catch (err) {
    const error = `❌ Failed to sync ${file}: ${err.message}`;
    console.error(error);
    errors.push(error);
  }
}

// Report results
console.log(`\n📊 API Asset Sync Summary:`);
console.log(`   ✅ Files synced: ${synced}`);
console.log(`   ❌ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.error('\n🚨 API asset sync errors:');
  errors.forEach(error => console.error(error));
  process.exit(1);
}

console.log('✅ API assets synced successfully!');
