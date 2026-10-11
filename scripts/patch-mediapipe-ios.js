#!/usr/bin/env node
// The published MediaPipe pose module imports the generated Swift header as a local
// quote include. CocoaPods builds it as a static framework on iOS, so Xcode places
// the generated Objective-C header in MediapipePosedetection.framework/Headers.
// Import it through the framework name; a local quoted import cannot resolve it.
//
// This postinstall patch runs after npm install on CI and for local Xcode builds.
// Remove when the upstream package corrects its native ObjC++ import.
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '..', 'node_modules',
  'react-native-mediapipe-posedetection', 'ios', 'MediapipePosedetection.mm');
const oldImport = '#import "MediapipePosedetection-Swift.h"';
const newImport = '#import <MediapipePosedetection/MediapipePosedetection-Swift.h>';
if (!fs.existsSync(file)) {
  console.error('Missing MediaPipe native source:', file);
  process.exit(1);
}
const before = fs.readFileSync(file, 'utf8');
if (before.includes(newImport)) {
  console.log('MediaPipe Swift header import already fixed');
} else if (before.includes(oldImport)) {
  fs.writeFileSync(file, before.replace(oldImport, newImport));
  console.log('Patched MediaPipe Swift header import for CocoaPods static framework');
} else {
  console.error('Unexpected MediaPipe ObjC++ source, update patch for upstream version');
  process.exit(1);
}
if (!fs.readFileSync(file, 'utf8').includes(newImport)) {
  throw Error('MediaPipe Swift bridge import verification failed');
}
