'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { readPackage, pack } = require('../extension-sdk/package-tools.cjs');
const { files } = readPackage(path.join(__dirname, 'language'));
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/texpro.language-zh-cn.tpp'), pack(files));
