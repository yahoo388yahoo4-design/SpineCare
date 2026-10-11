# SpineCare Mobile

Cross-platform React Native / Expo starter for Android and iOS, with English and Romanian UI, illustrative exercise animations, camera setup, and safety/privacy notices.

## Build locally
- Node.js 20+
- `npm install`
- `npx expo start`

## Build Android APK
GitHub Actions builds a release APK on pushes to `main`. Open the repository's **Actions** tab, choose the latest **Android APK** run, and download the `spinecare-android-apk` artifact.

## iOS IPA
A device-installable IPA must be signed with Apple Developer credentials and a provisioning profile. This repository does not contain those credentials. Configure an Expo/EAS project and Apple signing credentials to produce a signed IPA; never commit certificates, private keys, profiles, or tokens.

## Scope and safety
This is a prototype, not a medical device. It does not diagnose spinal conditions, measure discs/nerve compression/bone lesions, detect posture automatically, or prescribe exercises. The displayed exercises are placeholders, not treatment instructions. Use only a clinician-approved plan and clinician-reviewed media.

## Privacy
No patient reports, scans, identifiers, or personal health information belong in this repository. Camera permission is only used for a local preview; the app does not record or upload camera video. Do not add patient data or secrets to source control, logs, issues, or artifacts.
