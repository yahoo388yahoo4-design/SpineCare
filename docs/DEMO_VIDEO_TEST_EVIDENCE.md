# SpineCare — demo video test evidence (October 11, 2026)

## Verified results, not estimates

The GitHub Actions job [Prepare licensed pose demo videos — run 38183523365](https://github.com/yahoo388yahoo4-design/SpineCare/actions/runs/38183523365) **completed successfully**. The script downloaded two freely licensed demonstration clips and ran real MediaPipe Pose Landmarker Lite (mediapipe 0.10.21) on sampled source frames.

| Example | Input frames processed | Frames containing an estimated human pose | Video output |
| --- | ---: | ---: | --- |
| Shoulder press | 69 | 69 (100% of sampled frames) | 6.9 sec; H.264; 640×360; 10 fps |
| Bent-over row | 52 | 52 (100% of sampled frames) | 5.2 sec; H.264; 640×360; 10 fps |

The program **drew landmarks and limb segments directly onto the decoded frames** and saved playable H.264 files. It then probed codecs, size and duration, checked file hashes, and saved before/after reference-frame images.

### Downloadable evidence

**[Download processing evidence ZIP — before/after PNGs, per-frame MediaPipe landmark JSON, ffprobe results, manifest](https://github.com/yahoo388yahoo4-design/SpineCare/actions/runs/38183523365/artifacts/11719030539)**.

Bundled videos:

- [Annotated shoulder-press MP4](https://github.com/yahoo388yahoo4-design/SpineCare/blob/main/assets/demo/shoulder_press_overlay.mp4) — SHA-256: 75412e3b7d9d2a2dd64cdd5b444befee41c9d51ae5aab9b93544237b069e4957
- [Annotated bent-over-row MP4](https://github.com/yahoo388yahoo4-design/SpineCare/blob/main/assets/demo/bent_row_overlay.mp4) — SHA-256: c7c488d4e02d3dec35edfa326496fc57141e355735049e135fc6dfbb630f6625
- [Source attribution, transformations, codecs and detection counts](https://github.com/yahoo388yahoo4-design/SpineCare/blob/main/assets/demo/manifest.json)

Screenshots are paired as "before" and "overlay" for the same sampled frames. The landmark JSON records the estimated indices, positions and visibility, making this verifiable processing evidence rather than illustrative dots.

### Reproduce and retest

1. Install Python 3.11, mediapipe==0.10.21, opencv-python-headless==4.11.0.86, numpy<2 and ffmpeg.
2. Download the standard MediaPipe Pose Landmarker Lite float16 .task model to assets/models/pose_landmarker_lite.task.
3. Run: python scripts/generate_demo_videos.py
4. Verify: python scripts/generate_demo_videos.py --verify
5. After npm install: node scripts/check_demo_assets.js — parses JSX and checks local video files against manifest SHA-256 and attribution. A preflight JSON report will be placed in evidence/preflight.

The processing workflow's test itself passed; **testing the integrated application on Android and iOS is separate**. Check current Android APK and unsigned iOS Actions runs for their actual native build and emulator results. A source commit or passing offline MP4 processor does not prove the app builds or runs on physical devices.

### License and safety

Original CC BY 3.0 videos by **FitnessScape**:
- [Shoulder press source](https://commons.wikimedia.org/wiki/File:Shoulder_press_-_exercise_demonstration_video.webm)
- [Bent-over row source](https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm)
- [License (CC BY 3.0)](https://creativecommons.org/licenses/by/3.0/)

Changes made: frame rate and size changed, model-estimated pose landmarks/limbs and safety captions overlaid, silent H.264 MP4 conversion. Attribution and licensing are available in the app. No endorsement is implied.

A frame being detected is **not** evidence that the landmark coordinates are accurate, that the exercise is performed correctly, or that the movement is suitable for people with neck/back conditions. These are strength-training *technical examples*, NOT clinician-approved therapy or treatment advice. No clinical quality scoring or user-uploaded prerecorded-video inference is implemented.

The user-supplied Romanian integrated HTML report documents an earlier test state; it is not a current certification of these new features.
