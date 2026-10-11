#!/usr/bin/env python3
"""Build two reproducible, licensed, pose-annotated technical demo MP4 files.
Outputs are generated on GitHub Actions; never upload patient footage.
Prerequisites: Python 3.11, mediapipe==0.10.21, opencv-python-headless,
numpy<2, ffmpeg/ffprobe, and the bundled pose_landmarker_lite.task model.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.request

import cv2
import mediapipe as mp

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "demo"
EVIDENCE = ROOT / "evidence" / "demo"
MODEL = ROOT / "assets" / "models" / "pose_landmarker_lite.task"
LICENSE = "https://creativecommons.org/licenses/by/3.0/"
AUTHOR = "FitnessScape"
SOURCE_CLIPS = [
    {
        "id": "shoulder_press",
        "region": "shoulders",
        "title": {"en": "Shoulder press · detection example", "ro": "Ridicare deasupra capului · exemplu de detecție"},
        "commons": "https://commons.wikimedia.org/wiki/File:Shoulder_press_-_exercise_demonstration_video.webm",
        "source": "https://upload.wikimedia.org/wikipedia/commons/6/69/Shoulder_press_-_exercise_demonstration_video.webm",
        "file": "shoulder_press_overlay.mp4",
    },
    {
        "id": "bent_row",
        "region": "upper",
        "title": {"en": "Bent-over row · detection example", "ro": "Ramat din aplecat · exemplu de detecție"},
        "commons": "https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm",
        "source": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Bent-over_row_-_exercise_demonstration_video.webm",
        "file": "bent_row_overlay.mp4",
    },
]
# Standard MediaPipe Pose skeleton connections (33 landmarks).
EDGES = [(11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
         (11, 23), (12, 24), (23, 24), (23, 25), (25, 27),
         (24, 26), (26, 28), (0, 11), (0, 12)]
FPS = 10
WIDTH, HEIGHT = 640, 360


def hash_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url, dest):
    request = urllib.request.Request(url, headers={
        "User-Agent": "SpineCareDemoBuilder/1.0 (educational open-source pose demonstration; https://github.com/yahoo388yahoo4-design/SpineCare)",
        "Accept": "video/webm,application/octet-stream;q=0.9,*/*;q=0.5",
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=40) as src, open(dest, "wb") as dst:
                while True:
                    chunk = src.read(1024 * 1024)
                    if not chunk:
                        break
                    dst.write(chunk)
            if dest.stat().st_size < 10000:
                raise RuntimeError("Downloaded video unexpectedly small")
            return
        except Exception:
            if attempt == 2:
                raise
            time.sleep(3 * (attempt + 1))


def video_metadata(path):
    raw = subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=codec_name,width,height,nb_frames,avg_frame_rate",
         "-show_entries", "format=duration,size", "-of", "json", str(path)],
        text=True,
    )
    return json.loads(raw)


def detect_and_overlay(landmarker, frame, timestamp_ms):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = landmarker.detect_for_video(image, timestamp_ms)
    points = result.pose_landmarks[0] if result.pose_landmarks else []
    visible = {i: (int(p.x * WIDTH), int(p.y * HEIGHT))
               for i, p in enumerate(points)
               if p.visibility > 0.35 and 0 <= p.x <= 1 and 0 <= p.y <= 1}
    for a, b in EDGES:
        if a in visible and b in visible:
            cv2.line(frame, visible[a], visible[b], (138, 242, 49), 3, cv2.LINE_AA)
    for p in visible.values():
        cv2.circle(frame, p, 4, (104, 224, 255), -1, cv2.LINE_AA)
        cv2.circle(frame, p, 5, (5, 45, 32), 1, cv2.LINE_AA)
    cv2.rectangle(frame, (4, 4), (WIDTH - 4, 36), (9, 38, 28), -1)
    cv2.putText(frame, "MEDIAPIPE POSE | TECHNICAL DEMO", (14, 26),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (245, 255, 250), 2, cv2.LINE_AA)
    cv2.rectangle(frame, (4, HEIGHT - 29), (WIDTH - 4, HEIGHT - 4), (8, 36, 31), -1)
    cv2.putText(frame, "LANDMARK ESTIMATE - NOT CLINICAL GUIDANCE", (12, HEIGHT - 11),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (240, 255, 250), 1, cv2.LINE_AA)
    return frame, points, visible


def process_one(landmarker, item, raw_path):
    ASSETS.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(raw_path))
    if not cap.isOpened():
        raise RuntimeError("OpenCV could not open source: " + str(raw_path))
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 25
    step = max(1, round(source_fps / FPS))
    output = ASSETS / item["file"]
    encoder = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
         "-pix_fmt", "bgr24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS),
         "-i", "-", "-an", "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)],
        stdin=subprocess.PIPE,
    )
    count = found = frames_read = 0
    snapshots = []
    trace = []
    try:
        while count < 120:
            ret, src = cap.read()
            if not ret:
                break
            frame_number = frames_read
            frames_read += 1
            if frame_number % step != 0:
                continue
            resized = cv2.resize(src, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA)
            time_ms = int(round(count * 1000 / FPS))
            before = resized.copy()
            annotated, points, visible = detect_and_overlay(landmarker, resized, time_ms)
            found += bool(points)
            if len(snapshots) < 3 and (count == 0 or (count % 19 == 0 and points)):
                name = f'{item["id"]}_{count:03d}'
                cv2.imwrite(str(EVIDENCE / f"{name}_before.png"), before)
                cv2.imwrite(str(EVIDENCE / f"{name}_overlay.png"), annotated)
                snapshots.append(name)
            trace.append({"timeMs": time_ms,
                          "detected": bool(points),
                          "visiblePoints": len(visible),
                          "points": [{"i": i, "x": round(p.x, 4),
                                      "y": round(p.y, 4), "visibility": round(p.visibility, 3)}
                                     for i, p in enumerate(points) if i in visible]})
            encoder.stdin.write(annotated.tobytes())
            count += 1
    finally:
        cap.release()
        if encoder.stdin:
            encoder.stdin.close()
        status = encoder.wait(timeout=60)
        if status != 0:
            raise RuntimeError("ffmpeg encoding failed: " + str(status))
    if count < 10 or found == 0:
        raise RuntimeError(f"{item['id']}: insufficient frames/detections ({found}/{count})")
    result = {**item, "attribution": AUTHOR, "license": "CC BY 3.0",
              "licenseUrl": LICENSE, "modifications": "Resized, trimmed to 10 fps, MediaPipe pose landmarks and labels overlaid; converted to H.264 MP4 without audio.",
              "frameCount": count, "detectedFrames": found,
              "detectionFraction": round(found / count, 4),
              "width": WIDTH, "height": HEIGHT, "fps": FPS,
              "sha256": hash_file(output), "bytes": output.stat().st_size,
              "sourceSha256": hash_file(raw_path),
              "snapshots": snapshots}
    (EVIDENCE / f'{item["id"]}_landmarks.json').write_text(
        json.dumps(trace, indent=2), encoding="utf-8")
    (EVIDENCE / f'{item["id"]}_ffprobe.json').write_text(
        json.dumps(video_metadata(output), indent=2), encoding="utf-8")
    print(f"DEMO_PASS {item['id']}: {found}/{count} frames detected, "
          f"MP4 {output.stat().st_size} bytes, sha256 {result['sha256']}")
    return result


def verify(manifest):
    if len(manifest.get("videos", [])) != len(SOURCE_CLIPS):
        raise AssertionError("Expected two demo videos")
    for item in manifest["videos"]:
        target = ASSETS / item["file"]
        if not target.is_file() or hash_file(target) != item["sha256"]:
            raise AssertionError("Missing/corrupt demo video: " + str(target))
        info = video_metadata(target)
        streams = info.get("streams") or [{}]
        if streams[0].get("codec_name") != "h264":
            raise AssertionError("iOS/Android playback requires H.264")
        if int(streams[0].get("width", -1)) != WIDTH:
            raise AssertionError("Unexpected width")
        if item["frameCount"] < 10 or item["detectedFrames"] < 1:
            raise AssertionError("Detection evidence absent")
        if not item["licenseUrl"] or not item["commons"]:
            raise AssertionError("Missing attribution")
        print("VERIFY_PASS", item["id"], info["format"]["duration"], "seconds")


def build():
    if not MODEL.is_file():
        raise RuntimeError(f"MediaPipe model is missing: {MODEL}")
    BaseOptions = mp.tasks.BaseOptions
    vision = mp.tasks.vision
    options = vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODEL)),
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.35,
        min_pose_presence_confidence=0.35,
        min_tracking_confidence=0.35,
    )
    results = []
    with tempfile.TemporaryDirectory() as temp, vision.PoseLandmarker.create_from_options(options) as detector:
        for item in SOURCE_CLIPS:
            raw = Path(temp) / (item["id"] + ".webm")
            download(item["source"], raw)
            results.append(process_one(detector, item, raw))
    manifest = {"schemaVersion": 1, "purpose": "technical landmark demonstrations only; not prescribed exercise, not validated clinical feedback",
                "processor": "MediaPipe Pose Landmarker Lite, on offline source videos",
                "mediapipeVersion": mp.__version__, "videos": results}
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    (EVIDENCE / "processing-results.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    verify(manifest)
    print("DEMO_BUILD_PASS: two H.264 MP4s with actual offline MediaPipe overlay and inspection frames")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.verify:
        verify(json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8")))
    else:
        build()
