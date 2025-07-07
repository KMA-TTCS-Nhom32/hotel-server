const fs = require('fs');

const pkgPath = './package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = '@ahomevilla-hotel/node-sdk';
pkg.version = process.env.VERSION || '1.0.0';
pkg.author = 'Son DN <sondn@ahomevilla.team>';
pkg.description = 'AHomeVilla Hotel Node.js SDK';
pkg.repository = {
  type: 'git',
  url: 'git+https://github.com/KMA-TTCS-Nhom32/hotel-server.git',
};
pkg.scripts = {
  "prepare": "npm run build",
  "build": "tsc && tsc -p tsconfig.esm.json"
};
pkg.files = Array.from(new Set([...(pkg.files || []), "dist", "README.md"]));
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

const gitignorePath = '.gitignore';
const npmignorePath = '.npmignore';
const ignoreList = ['node_modules', '.npmrc'];

[gitignorePath, npmignorePath].forEach(path => {
  const existing = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
  const newEntries = ignoreList.filter(entry => !existing.includes(entry));
  if (newEntries.length > 0) {
    fs.appendFileSync(path, '\n' + newEntries.join('\n'));
  }
});

// add dist to .gitignore
if (!fs.readFileSync(gitignorePath, 'utf8').includes('dist')) {
  fs.appendFileSync(gitignorePath, '\ndist');
}
