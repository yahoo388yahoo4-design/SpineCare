# SpineCare Mobile

Cross-platform React Native / Expo prototype for Android and iOS. Interface languages: English and Romanian.

## Implemented in the current app

- Five screens: Today, Plan, Session, Camera, Progress.
- English/Romanian interface switch.
- Local exercise plan selection.
- User-created exercise entries with clinician instructions, clinician-set target sets/repetitions, optional video URL, explicit clinician-approval acknowledgement, and delete controls. The app does not validate the medical safety of those entries.
- Animated figure is clearly illustrative, not an exercise demonstration.
- Session timer, manual set counter, exercise selection, session completion history.
- Symptom check-ins (0–10) with optional note and before/after phase.
- On-device persistence for plans, custom entries, sessions, and check-ins using AsyncStorage.
- Share-sheet export of local session/check-in data as CSV-formatted text.
- Camera permission and live local preview on native devices; front/side/back/oblique framing guidance. Back view uses the rear camera.
- Safety, privacy, and emergency symptom notices.
- GitHub Actions Android APK build workflow.
- iOS bundle validation workflow (not an installable signed IPA).

## Still not implemented (do not treat as complete)

- **Automatic pose/joint tracking, camera-based repetition counting, movement-quality scoring, or GPU/ML inference.** The camera is a preview/framing aid only. These need a selected and licensed on-device model, a native frame-processing integration, device testing, and clinical validation. No clinical accuracy is claimed.
- **Clinician-approved exercise/video catalogue.** No medical exercise or video content is shipped. The app lets a user enter instructions/video links supplied by their clinician.
- **Cloud accounts, encrypted server sync, clinician dashboard, and remote monitoring.** Data remains local; do not assume backup or remote access.
- Automated tests, full accessibility audit, device-matrix testing, clinical validation, or medical-device regulatory review.
- A signed installable iOS IPA. As requested, signing is not included; IPA creation still requires Apple signing credentials and provisioning.

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
