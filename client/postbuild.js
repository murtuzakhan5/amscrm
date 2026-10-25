import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, 'dist', 'index.html');
const notFoundPath = path.join(__dirname, 'dist', '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✅ Generated dist/404.html for SPA fallback on Vercel');
}
