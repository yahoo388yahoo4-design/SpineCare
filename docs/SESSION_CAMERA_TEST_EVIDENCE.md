# Session review and camera controls — regression evidence

**Automated checks:** `npm run test:sessions` runs Node tests against the same `sessionStore.js` and `cameraControls.js` modules imported by the mobile app. Both Android and iOS CI run these checks before generating native projects.

The tests cover:
1. Rapid consecutive session saves interleaved with language and camera updates; reload preserves all sessions, landmarks and settings.
2. Save promises remain pending until the underlying device store acknowledges persistence.
3. Storage-write rejection surfaces an error; a later queued write can recover the latest state.
4. Older sessions without a pose trace remain selectable and readable.
5. A draft session is recoverable across a simulated app restart; completion archives it and clears the draft.
6. Clear-progress removes sessions and check-ins without deleting the exercise plan/camera preference.
7. Malformed landmark coordinates are discarded for safe review.
8. Physical lens options are filtered by available camera devices; zoom is bounded to hardware limits.

**Interaction path:** Today → choose approved plan → Start Session → open Camera → allow camera permission → enable pose detection → mark sets → Finish → Progress. The session should appear automatically with duration and saved point count. Press Play or step through snapshots. Close/relaunch; the same session should be listed. Camera → change facing/lens/zoom and orientation; close/relaunch; preferences should persist. Start again and restart while recording; Today should offer to resume the saved draft.

**Limitations:** These are automated store and configuration tests. A successful native APK/iOS archive does not demonstrate that device-specific camera lenses, orientation locks, landmark coordinates, or UI playback behave correctly on every real phone. Verify such behavior using devices with supported lenses and Apple-signed iOS builds. Android emulator screens are best-effort (emulator filesystem/I/O can disconnect); failure to capture screenshots must not be reported as a passing UI test.

**Local-only data:** Camera video is never stored. Completed sessions save sampled normalized landmarks; draft recovery does not capture every frame. Changing bundle/package IDs between other SpineCare builds does not migrate those versions' local data.
