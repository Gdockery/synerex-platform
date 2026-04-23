'use strict';

/**
 * Post-build pass: obfuscate emitted browser bundles under .tmp/public.
 * Run only via `npm run build:obfuscate` (default `npm run build` skips this).
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ROOT = path.resolve(__dirname, '..', '.tmp', 'public');
if (!fs.existsSync(ROOT)) {
  console.error('obfuscate-public-js: .tmp/public not found — run `npm run build` first.');
  process.exit(1);
}

const options = {
  optionsPreset: 'low-obfuscation',
  compact: true,
  sourceMap: false,
};

const files = glob.sync('**/*.js', { cwd: ROOT, nodir: true, absolute: true });
let count = 0;

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  if (code.length < 64) continue;
  try {
    const result = JavaScriptObfuscator.obfuscate(code, options);
    fs.writeFileSync(file, result.getObfuscatedCode());
    count += 1;
  } catch (err) {
    console.error('obfuscate-public-js: failed on', file, err.message || err);
    process.exit(1);
  }
}

console.log('obfuscate-public-js: rewrote', count, 'file(s) under .tmp/public');
