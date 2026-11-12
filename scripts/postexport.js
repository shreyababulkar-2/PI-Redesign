// Static hosts such as Cloudflare Workers assets (and Netlify before it) skip folders named "node_modules", and
// Expo puts the bundled font files in dist/assets/node_modules/... That leaves the fonts missing on the deployed
// site, so the page falls back to the browser's default serif font. This moves them to dist/assets/vendor and
// updates the references in the bundle.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (!fs.existsSync(from)) {
  console.log('postexport: nothing to move');
  process.exit(0);
}
fs.renameSync(from, to);

let changed = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|html|json)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const next = text.replace(/assets\/node_modules\//g, 'assets/vendor/');
      if (next !== text) {
        fs.writeFileSync(full, next);
        changed++;
      }
    }
  }
};
walk(dist);
console.log(`postexport: moved assets/node_modules -> assets/vendor, updated ${changed} file(s)`);
