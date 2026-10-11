#!/usr/bin/env node
// Static source/asset checks only; not proof of native runtime or clinical validity.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel));
const app = read('App.js').toString('utf8');
const ast = parser.parse(app, {sourceType:'module', plugins:['jsx']});
assert(ast.program.body.length > 0, 'App.js must parse');
const catalog = JSON.parse(read('assets/demo/manifest.json'));
assert.equal(catalog.schemaVersion, 1);
assert(catalog.videos.length >= 2);
const videos = catalog.videos.map(item => {
  assert(/^[a-z0-9_-]+$/.test(item.id));
  assert(item.commons.startsWith('https://commons.wikimedia.org/'));
  assert(item.attribution && item.license === 'CC BY 3.0' && item.licenseUrl);
  assert(item.frameCount >= 10 && item.detectedFrames > 0 && item.detectedFrames <= item.frameCount);
  assert(item.width === 640 && item.height === 360 && item.fps === 10);
  const filename = 'assets/demo/' + item.file;
  assert(app.includes("require('./" + filename + "')"),
    'React Native bundle lacks static require: ' + filename);
  const bytes = read(filename);
  assert(bytes.length > 10000 && bytes.length === item.bytes, 'Unexpected video size');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256);
  assert.equal(bytes.toString('latin1', 4, 8), 'ftyp', 'Not an MP4');
  return {id:item.id,frames:item.frameCount,detected:item.detectedFrames,
    sha256:item.sha256,bytes:bytes.length,attribution:item.attribution};
});
const report={result:'PASS',kind:'JSX parse + bundled MP4 hashes + source attribution',
  revision:process.env.GITHUB_SHA||'local',
  note:'Not a camera/voice test, mobile playback test or medical validation.',
  videos};
fs.mkdirSync(path.join(root,'evidence','preflight'),{recursive:true});
fs.writeFileSync(path.join(root,'evidence','preflight','checks.json'),JSON.stringify(report,null,2)+'\n');
console.log('PREFLIGHT_PASS: App.js JSX parsed; ' + videos.length + ' local MP4 hashes and source credits verified');
