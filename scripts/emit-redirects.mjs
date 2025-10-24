import fs from 'node:fs';
import path from 'node:path';

const out = 'app/dist/humanproof-web/browser';
const redirects = [
  '/app/* / 301',
  '/app/verify /verify 301',
  '/app/verify/tool /verify/tool 301',
  '/app/t/:id /t/:id 301',
  '/app /  301'
].join('\n') + '\n';

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, '_redirects'), redirects, 'utf8');

// Copy robots.txt from public/
if (fs.existsSync('public/robots.txt')) {
  fs.copyFileSync('public/robots.txt', path.join(out, 'robots.txt'));
}

console.log('✅ Redirects and robots.txt emitted to dist');

