# SpineCare Mobile

Cross-platform React Native / Expo prototype for Android and iOS. Interface languages: English and Romanian.

## Implemented in this prototype
- Five screens: Today, Plan, Session, Camera, Progress.
- English/Romanian UI switch.
- Editable local selection of placeholder exercise entries (not a medical prescription).
- Animated stick-figure illustration placeholders.
- Session elapsed timer, set counter, and completion log.
- Symptom score check-ins (0–10) with a short optional note.
- On-device persistence for selected plan, sessions, and check-ins using AsyncStorage.
- Camera permission and live local preview on native devices; front/side/back/oblique framing guidance. Back view uses the rear camera.
- Safety and privacy notices.
- GitHub Actions Android APK build workflow.

## Not implemented / requires additional work
- No clinician-approved exercise library or clinician-recorded exercise videos are supplied.
- No automatic pose/joint tracking, rep counting from camera, movement-quality scoring, spinal alignment assessment, or GPU/ML inference.
- No server, account system, cloud sync, clinician dashboard, data export, or remote monitoring.
- The camera view selector provides framing instructions; side/oblique positions require the user to turn their body.
- No clinical validation, accessibility audit, device matrix testing, or medical-device regulatory review has been completed.
- The iOS workflow validates an iOS bundle only; it does not produce a signed, installable IPA. An IPA requires Apple signing credentials and provisioning configured through EAS or Xcode.

## Run locally
- Node.js 20+
- `npm install`
- `npx expo start`

## Android APK
GitHub Actions builds a release APK on pushes to `main`. Open **Actions**, choose the latest **Android APK** run, and download the `spinecare-android-apk` artifact after a successful run.

## iOS IPA
A device-installable IPA requires an Apple Developer account, signing credentials, and a provisioning profile. Configure EAS and Apple signing credentials securely; never commit certificates, private keys, profiles, or tokens.

## Medical safety
This is a prototype, not a medical device or a substitute for clinical care. It does not diagnose spinal conditions or measure disc protrusions, nerve compression, cysts, or bone lesions. The example exercise entries and animations are placeholders, not treatment recommendations. Given the described cervical findings including a focal C6 lesion, have the treating clinician explicitly approve the movements, range, repetitions, and stop rules before any use. Stop and seek urgent medical assessment for new or progressive weakness, loss of coordination, gait/balance difficulty, or bowel/bladder changes.

## Privacy
No patient reports, scans, identifiers, or patient-specific findings are included in this repository. The app has no network backend or upload path for health data. Camera preview is local only and is not recorded by the app. Session and symptom data are stored on-device; avoid identifying details in notes. Uninstalling the app or clearing app data may remove local history. Do not commit patient data or secrets to source control, logs, issues, or build artifacts.
