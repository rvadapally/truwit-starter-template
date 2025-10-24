import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routes = [
  '',
  'products',
  'truviz',
  'audit',
  'pricing',
  'verify',
  'legal/privacy',
  'legal/terms'
];

const baseUrl = 'https://truwit.ai';
const lastmod = new Date().toISOString().split('T')[0];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => {
  const priority = route === '' ? '1.0' : '0.8';
  return `  <url>
    <loc>${baseUrl}/${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

const outputDir = join(__dirname, '..', 'dist', 'humanproof-web', 'browser');
const outputPath = join(outputDir, 'sitemap.xml');

// Ensure directory exists
mkdirSync(outputDir, { recursive: true });

// Write sitemap
writeFileSync(outputPath, sitemap, 'utf8');

console.log('✅ Sitemap generated at:', outputPath);

