/**
 * Post-build pass: obfuscate Vite output under dist/.
 * Run only via `npm run build:obfuscate` (default `npm run build` skips this).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'dist');

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else if (ent.isFile() && ent.name.endsWith('.js')) yield p;
  }
}

if (!fs.existsSync(ROOT)) {
  console.error('obfuscate-dist-js: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const options = {
  optionsPreset: 'low-obfuscation',
  compact: true,
  sourceMap: false,
};

let count = 0;
for (const file of walk(ROOT)) {
  const code = fs.readFileSync(file, 'utf8');
  if (code.length < 64) continue;
  try {
    const result = JavaScriptObfuscator.obfuscate(code, options);
    fs.writeFileSync(file, result.getObfuscatedCode());
    count += 1;
  } catch (err) {
    console.error('obfuscate-dist-js: failed on', file, err.message || err);
    process.exit(1);
  }
}

console.log('obfuscate-dist-js: rewrote', count, 'file(s) under dist/');
