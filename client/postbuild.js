import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');
const vercelSrc = path.join(__dirname, 'vercel.json');
const vercelDest = path.join(distDir, 'vercel.json');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✅ Generated dist/404.html for SPA fallback on Vercel');
}

if (fs.existsSync(vercelSrc)) {
  fs.copyFileSync(vercelSrc, vercelDest);
  console.log('✅ Copied vercel.json into dist for static routing fallback');
}
