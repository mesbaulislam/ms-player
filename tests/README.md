# MS Player v1.0.1 — Manual test checklist (Energizer E241S)

No device testing was performed in the build environment. Run every item
below on the real phone. Tick, note the result, and report failures with
the exact on-screen text.

## v1.0.1 fixes — check these FIRST
- [ ] NO hint/instruction lines anywhere ("which button does what" text
      is gone from Home, Settings, lock, all dialogs, empty screen).
      Footer softkey labels (Open / Select / Back …) still show.
- [ ] Settings: focus starts in Extensions; Up/Down moves to the next /
      previous field (checkboxes -> PIN -> Reset button) and never gets
      trapped in the text input; Left/Right still moves the text cursor
      inside the input; Enter on a text input moves to the next field.
- [ ] Help: Up/Down scrolls the whole shortcut list to the bottom.
- [ ] Video details: Up/Down scrolls the long details (incl. the decoded
      Path with real brackets/spaces, no `%5B` / `%20`).
- [ ] Player: video fills the whole stage; top bar = 1-line filename,
      bottom bar = progress + ONE `time · speed · zoom` line, no
      duplicates, no overlap, no Details on the player screen.
- [ ] Player auto-hide: after ~3s of no key while playing, top + bottom
      bars hide (subtitles stay); any key shows them again; while paused
      they stay visible.
- [ ] Fullscreen: LSK enters smoothly (animated, not a jump); RSK
      restores smoothly.
- [ ] Player options (`0`) has NO Audio tracks / Subtitles entries.
      `8` does nothing in the player.
- [ ] Focused menu/file item is unmistakable: bright blue bg + white
      BOLD text + bright border; every action shows a toast
      (Speed / Muted / Rotate / File hidden / Settings saved …).
- [ ] Video options menu unchanged: Play / Resume / Details / Hide /
      Unhide.

## Packaging / install
- [ ] ZIP: `manifest.webapp` is at the ZIP root (not nested in a folder).
- [ ] ZIP: `assets/icon-56.png`, `assets/icon-112.png`,
      `assets/icon-128.png` present; icon shows correctly after install.
- [ ] Upload via KaiStore Personal Testing; install on the E241S.
- [ ] No "Install Error — An issue has occurred". If it appears, record the
      exact text + any installer log — that log is the key diagnostic.

## Launch
- [ ] Launch from the app icon -> Home screen appears (Videos, Continue
      Watching, Hidden Files, Settings, Help).
- [ ] D-pad moves focus; Enter opens each Home item; RSK returns Home.

## Library / search
- [ ] Videos screen lists .mp4 / .3gp / .mkv / .mpa files from SD card.
- [ ] Each row shows filename + size + type; focus highlight is visible.
- [ ] Search filters as you type; RSK returns to the list.
- [ ] Digit-jump: type e.g. `3`, pause -> focus moves to the 3rd file.
- [ ] Empty card / no files -> Empty-library screen + Rescan works.

## Playback (MP4, 3GP, MKV, MPA samples)
- [ ] Enter on a file -> Options -> Play starts playback with sound.
- [ ] Enter toggles pause/play. Left/Right seek -/+10s. Up/Down volume.
- [ ] `0` opens Player options; RSK closes it and playback continues.
- [ ] `*` / `#` zoom out/in. `1` / `3` rotate. `4` / `6` speed.
- [ ] `2` resets speed to 1.0x. `5` restores defaults.
- [ ] `9` opens Jump-to-time; entering HH:MM:SS jumps correctly.
- [ ] Hold `9` restarts from 0:00. Hold `1`/`3` seeks -/+200s.
- [ ] Hold `5` toggles repeat. Hold `4`/`6` fine-rotates.
- [ ] LSK enters fullscreen (rotated); RSK restores.
- [ ] Progress bar + `current / duration` advance; `7` returns to list.
- [ ] `Call` saves a screenshot (check pictures storage).
- [ ] Unsupported/corrupt file -> Playback error dialog, no freeze.
- [ ] Missing file (deleted after history saved) -> Missing-file dialog,
      history entry removed.

## Continue Watching / history
- [ ] Play a video, pause part-way, go back: entry appears with resume time.
- [ ] Options -> Resume continues from the saved position.
- [ ] Continue screen LSK -> Clear history asks for confirmation, then clears.

## File Manager Share / Open With
- [ ] File Manager -> video -> Options -> Share -> MS Player plays it.
- [ ] Same via Open With if offered. No "empty player" state.
- [ ] Icon launch afterwards still shows Home (no stuck state).

## Subtitles (silent auto-load, NO option)
- [ ] Place `name.vtt` beside `name.mp4` -> subtitles appear automatically
      + "Subtitles found (.vtt)" toast. No menu, no toggle anywhere.
- [ ] Rename to `name.srt` (no .vtt) -> .srt subtitles appear automatically.
- [ ] Malformed subtitle file -> no crash; subtitles just stay off/empty.
- [ ] There is NO Subtitles screen / option / `8` toggle any more.

## Audio tracks (expect the honest limitation)
- [ ] MKV with Hindi + English + Japanese tracks: video plays with
      default audio. There is NO Audio tracks option any more.

## .mpa
- [ ] `.mpa` file (audio + `[shifat100]` + video) plays with synced audio.
- [ ] `.mpa` without the separator falls back to normal playback.

## Hide / Unhide
- [ ] Options -> Hide: file disappears from the list, appears in Hidden Files.
- [ ] Hidden Files -> Options -> Unhide: file returns to downloads/.

## Settings / lock
- [ ] Change extensions, toggle background + Auto Scale, Save persists
      after app restart. Corrupt settings (if ever edited) -> defaults.
- [ ] App lock: set PIN, restart app -> PIN screen; wrong PIN rejected,
      right PIN unlocks. PIN is never shown in plain text anywhere.
- [ ] Settings -> Reset asks for confirmation, then restores defaults.

## Background play
- [ ] Background ON: hide/minimize app mid-video -> audio continues;
      return -> video resumes near the same position.
- [ ] Background OFF: hiding the app pauses the video.

## Visual
- [ ] No horizontal overflow; all text readable at 240x320.
- [ ] Every screen shares the navy + electric-blue style.
- [ ] No dead buttons: every visible control does something.
