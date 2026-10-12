# SpineCare GPT-6 Mobile

Cross-platform React Native / Expo prototype for Android and iOS. Interface languages: English and Romanian.

## Separate GPT-6 application identity (side-by-side installs)

This GPT-6 build is intentionally distinct from other SpineCare variants:

| Setting | Value |
| --- | --- |
| Android application ID (package) | `com.spinecare.mobile.gpt6` |
| iOS bundle identifier | `com.spinecare.mobile.gpt6` |
| Installed launcher label | `SpineCare GPT-6` |
| Expo slug | `spinecare-gpt6` |
| npm project name | `spinecare-mobile-gpt6` |
| App version | `0.2.0` (Android versionCode 2 / iOS buildNumber 2) |

The native iOS Xcode target/scheme remains `SpineCare`; the home-screen label and bundle ID are distinct. CI verifies the generated native identifiers and packaged IPA/APK IDs and names the downloadable artifacts `SpineCare-GPT6-...`.

**Installation warning:** changing identifiers makes a new app, not an in-place update of `com.spinecare.mobile`. Prior local plans, session traces, and check-ins remain in the old app's isolated local storage and do not automatically move to this variant. The two apps can coexist. For installing the unsigned iOS archive on hardware, the signing profile/certificate must permit the new bundle ID.


## Camera orientation, lens, zoom and saved-session review

- In **Camera**, select **Portrait** or **Landscape**; the selection is persisted locally and restored on next launch. The same orientation control also appears in **Settings**. iOS full-screen mode enables runtime orientation control on iPad; actual rotation can still be restricted by OS/window mode.
- Select **Front (selfie)** or **Rear**, then choose among detected hardware camera lenses (Automatic, Ultra-wide, Wide, Telephoto where available). Use 0.5×/1×/2×/3×/4× or ±0.25× zoom. Unsupported lenses are not listed; actual zoom is clamped to the device's supported range. Front/back selection is independent of the exercise-view guide.
- **Start Session → mark sets → optionally enable local pose camera → Finish**: the app waits for the local save to complete, then opens **Progress** and automatically selects the completed session. Review all 100 most recent sessions, their duration, exercise IDs, sets and pose sample playback with frame navigation. Older sessions without sensor traces still display their details.
- Active sessions periodically save a draft (every ~5 seconds); after reopening an interrupted session, the Today page offers **Resume interrupted session** or **Discard unfinished session**. A force-close can lose up to approximately five seconds of unsaved tracking samples.
- The app uses serialized local storage updates for sessions, check-ins, custom exercises, language and camera controls. Save confirmation occurs **only after** AsyncStorage acknowledges the write. Camera footage itself is not recorded; replay shows estimated pose landmarks sampled only while the session and camera were active.
- Automated regression tests: `npm run test:sessions` (Node built-in test runner) verifies save/reload, concurrent writes, failing storage, legacy trace-free sessions, draft recovery, check-in clearing, and hardware-aware lens/zoom bounds. These are software/storage tests, not proof of physical-device camera accuracy or rehabilitation safety.
- Android CI uploads the verified release APK before attempting emulator screenshots; emulator boot/render/screenshot failures are reported separately and do not conceal a successful APK build.

## Implemented in the current app

- Six screens: Today, Plan, Session, Camera, Progress, and Settings.
- English/Romanian interface switch, including persistent Settings selection, translated built-in guides, and matching text-to-speech language.
- Local exercise plan selection, clinician-configurable neck-only, shoulders/upper-body and full-body placeholders, body-region filtering, and custom clinician-approved exercise entries.
- Clinician instructions, target sets/repetitions, optional video URL, and delete controls.
- Session timer, manual set counter, session completion history, and symptom check-ins (0–10).
- On-device persistence for plans, custom entries, sessions, check-ins, and non-secret settings using AsyncStorage.
- CSV-formatted local data sharing through the device share sheet.
- **On-device MediaPipe Pose Landmarker integration** using a native React Native/Vision Camera module. The Android and iOS build workflows download the lightweight pose model and bundle it with the native app so inference does not need a network connection after installation. This requires a native development/release build; Expo Go cannot load the native module.
- Settings for local pose processing, CPU/GPU delegate, frame processing rate, remote server URL/IP, analysis endpoint, username, password, remote opt-in, landmark sharing, and explicit insecure-private-LAN HTTP allowance.
- Remote server connection check. If the server is unreachable, the app continues local operation and does not wait for a remote result.
- Remote enhancement sends pose landmarks only, never camera frames. Password is stored using platform secure storage; other preferences remain local.
- Optional example FastAPI service in `server/` with authenticated `/health` and `/analyze/pose` endpoints. Its current remote summary is a technical landmark-visibility check, not a clinical assessment.
- Camera preview with live tracked pose-dot/limb overlay and front/side/back/oblique framing guidance. Guided camera setup explains device height, distance, body-region framing, and stop rules in both languages.
- Optional spoken start/finish/step guidance, and tap-to-talk commands: start, stop, next, set done, and camera, in English and Romanian. Speech recognition needs explicit microphone and speech permissions and may use the platform provider/network.
- Two offline bundled technical demo MP4s show genuine MediaPipe pose landmark overlays on openly licensed FitnessScape clips (shoulder press and bent-over row), with English/Romanian captions, attribution, and source links. They are NOT rehabilitation prescriptions or clinician-vetted exercises.
- Clinician-supplied video links: HTTPS MP4/HLS video guides can play inside the app; other URLs open in a browser. No patient-specific clinician-vetted treatment videos are bundled.
- Saved session sensor replay in Progress: up to 180 locally stored, time-stamped landmark snapshots (roughly one per second) when the live camera is enabled **during** a session. The playback shows an estimated stick/sensor overlay; it is not a saved camera recording or real video analysis.
- Safety, privacy, and emergency symptom notices.
- GitHub Actions Android APK build and unsigned iOS archive/IPA workflows. The unsigned IPA and xcarchive must be signed locally with your own Apple developer signing identity/profile.

## Built-in licensed pose demo videos and testing

- The Camera screen plays two *offline* H.264 demo videos, with preprocessed detected-landmark overlays baked into the pixels. Playing them does not run MediaPipe on the video in real time. A separate live-camera mode uses device inference.
- Video origin and terms: FitnessScape, CC BY 3.0. Source pages: https://commons.wikimedia.org/wiki/File:Shoulder_press_-_exercise_demonstration_video.webm and https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm ; license: https://creativecommons.org/licenses/by/3.0/ . Modifications: resolution and frame rate reductions, landmark / skeleton drawings, on-video technical disclaimers and H.264 transcoding without audio. The app includes the attributions and original-source links.
- GitHub Actions "Prepare licensed pose demo videos" workflow downloads sources, processes frames with MediaPipe Pose Landmarker Lite, generates annotated MP4s, before/after PNG frames, landmark JSON and ffprobe metadata, verifies codec / dimensions / duration / hashes, and commits verified files into assets/demo.
- Detailed verified video test results and artifact links: [Demo video test evidence](docs/DEMO_VIDEO_TEST_EVIDENCE.md).
- After npm install, node scripts/check_demo_assets.js parses App.js JSX, verifies every bundled MP4's SHA-256 and attribution, and creates a JSON evidence report. This is a static check, not a device test.

## Important limits and next validation

- MediaPipe landmarks describe estimated visible body keypoints. They do not diagnose spinal alignment, disc protrusions, nerve compression, bone lesions, or whether an exercise is safe.
- Automatic clinically meaningful repetition counting, movement-quality scoring, personalized rehabilitation advice, an end-user prerecorded-video analysis workflow, and a clinician-reviewed exercise/video catalogue are **not** implemented. The two bundled technical demos were processed in advance using an automated MediaPipe video conversion script. Live pose landmarks are a technical tracking visual only.
- Voice recognition is push-to-talk and depends on OS support; it is not an always-on assistant. Availability and accuracy of Romanian speech/voice depend on installed voices and recognition providers.
- The example remote server does not run a large AI model; it demonstrates authenticated offload and returns a basic visibility summary. Replace/extend it only with a separately validated algorithm.
- Native build success is not the same as device testing. Camera permissions, model packaging, GPU compatibility, thermal behavior, network loss, server authentication, and Android/iOS devices still need testing before use.
- No cloud accounts, data synchronization, clinician dashboard, or automatic backup are included.
- Do not use the app for unsupervised rehabilitation. A clinician must approve exercises and doses, particularly given the reported cervical findings and C6 lesion.

## Run locally
- Node.js 20+
- `npm install`
- Download the MediaPipe Lite model before a native build:
  - macOS/Linux: `mkdir -p assets/models && curl -L --fail -o assets/models/pose_landmarker_lite.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`
  - Windows PowerShell: `New-Item -ItemType Directory -Force assets/models; Invoke-WebRequest https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task -OutFile assets/models/pose_landmarker_lite.task`
- `npx expo prebuild` then build a native development/release app. Native MediaPipe and Vision Camera modules do not run in Expo Go.
- `npx expo start` is useful for the JS development server, but camera inference requires the native build.

## Android APK
GitHub Actions builds a release APK on pushes to `main`. Open **Actions**, choose the latest **Android APK** run, and download the `spinecare-android-apk` artifact after a successful run.

## iOS IPA
A device-installable IPA requires an Apple Developer account, signing credentials, and a provisioning profile. Configure EAS and Apple signing credentials securely; never commit certificates, private keys, profiles, or tokens.

## Medical safety
This is a prototype, not a medical device or a substitute for clinical care. It does not diagnose spinal conditions or measure disc protrusions, nerve compression, cysts, or bone lesions. The example exercise entries and animations are placeholders, not treatment recommendations. Given the described cervical findings including a focal C6 lesion, have the treating clinician explicitly approve the movements, range, repetitions, and stop rules before any use. Stop and seek urgent medical assessment for new or progressive weakness, loss of coordination, gait/balance difficulty, or bowel/bladder changes.

## Privacy
No patient reports, scans, identifiers, or patient-specific findings are included in this repository. Session, symptom, sampled pose-trace, and settings data remain on-device. Pose-trace samples can include sensitive movement data. Camera frames are processed locally and are not recorded or transmitted. Spoken commands are not stored by the app; the OS speech-recognition provider may process audio and may require a network connection. Google’s MediaPipe Tasks privacy notice says the SDK may send performance/utilization metrics when connected; this is disclosed in Settings. If remote enhancement and landmark sharing are explicitly enabled, the app sends pose coordinates (not camera frames) to the configured server. Remote credentials are stored using platform secure storage. Use HTTPS whenever possible; the insecure HTTP option should be limited to a trusted private LAN. Review the server code and firewall configuration before deployment. Avoid identifying details in notes. Uninstalling the app or clearing app data may remove local history. Do not commit patient data or secrets to source control, logs, issues, or build artifacts.
