#!/usr/bin/env node
// Fail CI if the GPT-6 variant accidentally reuses another SpineCare app ID.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || '--config';
const id = 'com.spinecare.mobile.gpt6';
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const packageJson = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(config.android.package, id, 'Android package ID collision risk');
assert.equal(config.ios.bundleIdentifier, id, 'iOS bundle identifier collision risk');
assert.equal(config.ios.infoPlist.CFBundleDisplayName, 'SpineCare GPT-6');
assert.equal(config.slug, 'spinecare-gpt6');
assert.equal(config.orientation, 'default', 'App config must allow landscape and portrait');
assert.equal(config.ios.requireFullScreen, true, 'iPad orientation lock requires full screen');
assert(config.plugins.some(p=>Array.isArray(p)&&p[0]==='expo-screen-orientation'));
assert.equal(config.android.versionCode, 2);
assert.equal(config.ios.buildNumber, '2');
assert.equal(packageJson.name, 'spinecare-mobile-gpt6');
assert(config.plugins.includes('./plugins/withGPT6LauncherName'), 'Missing Android launcher-label plugin');
if (mode === '--android-native') {
  const gradle = fs.readFileSync(path.join(root,'android/app/build.gradle'),'utf8');
  assert(gradle.includes(id), 'Generated Gradle app ID differs from Expo configuration');
  const xml = fs.readFileSync(path.join(root,'android/app/src/main/res/values/strings.xml'),'utf8');
  assert(xml.includes('SpineCare GPT-6'), 'Android launcher name not generated');
}
if (mode === '--ios-native') {
  const pbx = fs.readFileSync(path.join(root,'ios/SpineCare.xcodeproj/project.pbxproj'),'utf8');
  assert(pbx.includes(id), 'Generated Xcode bundle identifier differs from Expo configuration');
}
if (!['--config','--android-native','--ios-native'].includes(mode)) throw Error('Unknown mode: '+mode);
console.log('IDENTITY_PASS',mode,'android='+id,'ios='+id,'display=SpineCare GPT-6','version='+config.version);
