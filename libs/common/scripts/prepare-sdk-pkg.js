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
pkg.files = Array.from(new Set([...(pkg.files || []), "dist", "README.md"]));
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

const gitignorePath = '.gitignore';
const npmignorePath = '.npmignore';
const ignoreList = ['node_modules', '.npmrc'];
fs.appendFileSync(gitignorePath, '\n' + ignoreList.join('\n'));
fs.appendFileSync(npmignorePath, '\n' + ignoreList.join('\n'));
