# MS Player

A lightweight KaiOS video player for 240×320 keypad phones. Version 1.0.1.

MS Player plays local videos, resumes where you left off, silently auto-loads external subtitles, and opens videos shared from a file manager — all offline, with no ads and no tracking.

> **Platform:** KaiOS 2.5.3.2 (240×320 keypad phones, e.g. Energizer E241S)
> **Developer:** Mesbaul Islam ([@mesbaulislam](https://github.com/mesbaulislam))
> **License:** MIT — see [LICENSE](LICENSE)

> **Status — please read:** this package is **unsigned** and v1.0.1 has **not been verified on a physical device**. v1.0.0 installed and launched on the E241S, and the v1.0.1 fixes came from that on-device feedback — but the v1.0.1 build itself still needs a device test (see `tests/README.md`). Earlier MS Player builds showed an "Install Error" on this device; this fresh build uses a minimal, individually-justified permission set to remove the most common manifest/asset causes, but the fix is not verified until the package installs on the real phone.

This is the **video** player. It is a different project from MS Music Player Pro (the audio player) — do not confuse the two.

## Features

- **Local video library** — scans DeviceStorage for videos (scan extensions configurable in Settings; default `mp4,3gp,mkv,mpa,3gpp`); search/filter; digit-jump to the Nth file
- **Continue Watching + resume** — saved positions (metadata only) with resume offered on open; history can be cleared
- **Playback controls** — play/pause, ±10s seek, volume (system `volumeManager` with `video.volume` fallback), mute, progress + duration
- **Speed 0.5x–2.0x, zoom, rotate, repeat, jump-to-time**
- **Fullscreen** — rotate 90° + scale 1.36 with a smooth 0.25s transition, restoring the previous transform on exit
- **Compact player** — the video fills the whole stage; a thin top bar shows the 1-line filename, a thin bottom bar shows the progress bar + one `current / duration · speed · zoom` line; overlays auto-hide after 3s of no key while playing and re-appear on any key (they stay visible while paused or while a dialog is open); subtitles never auto-hide
- **External subtitles, silent auto-load** — an external `.vtt` (tried first) or `.srt` file beside the video (same basename) loads automatically when playback starts and renders with no menu, no toggle, no option
- **Hide / Unhide** — Hide copies a file into the `hdn-svid/` folder on the SD card, deletes the original, and records an index; Unhide restores it to `downloads/`
- **Video options menu** — Play / Resume / Details / Hide / Unhide
- **Video details** — filename and path shown display-decoded (`%20` / `%5B` / `%5D` → readable text)
- **App lock** — optional PIN lock on launch; the PIN is stored only as an FNV-1a hex hash, never plaintext (a local lock, not encryption)
- **Background play** — when on, a hidden audio element continues the audio while the app is hidden; returning resumes the video there; when off, the video pauses when hidden
- **Screenshot** — `Call` / `s` saves a screenshot to pictures storage (best-effort)
- **File Manager Share / Open With flow** — share a video from a file manager (or open it with MS Player) and it plays immediately (resume offered when a position is saved); opening MS Player from its icon shows Home
- **Settings** — extensions list, background playback, Auto Scale, app lock + PIN, Reset (clears settings + history + hidden index, with confirmation)
- **Keypad-only navigation** — a single global key handler; strong focus highlight (bright blue + white bold text + 2px border) and a high-contrast toast for every action
- **Honest errors** — playback errors, missing files, unsupported features, and empty-library states are shown as dialogs, never faked as success

## Supported media formats

| Format | Support |
|---|---|
| MP4 (`.mp4`) | Library scan + `view` / `open` activity (`video/mp4`) |
| 3GP (`.3gp`) | Library scan |
| MKV (`.mkv`) | Library scan + `view` / `open` activity (`video/x-matroska`) |
| WebM (`.webm`) | `view` / `open` activity (`video/webm`) |
| 3GPP (`.3gpp`, `.3gpp2`) | Library scan (`.3gpp`) + `view` / `open` activity (`video/3gpp`, `video/3gpp2`) |
| Ogg (`.ogg`) | `view` / `open` activity (`video/ogg`) |
| `.mpa` (custom container) | **Custom format, not standard video:** the file is `audio bytes + literal separator "[shifat100]" + video bytes`. MS Player splits on that separator and plays the two parts with synced elements (sync is best-effort). If the separator is absent, it falls back to normal playback of the whole file |
| MP3 (`.mp3`) | Accepted by the `share` activity filename pattern only (audio files are not library videos) |

Declaring a MIME type does **not** guarantee the device codec can decode the file — a decode failure shows a playback-error dialog instead of a fake success.

### Subtitles

- **Supported:** external `.vtt` (first) / `.srt` beside the video, auto-loaded silently. Timestamps are parsed for both formats; malformed lines are skipped; text is rendered with `textContent` only (no HTML).
- **Not supported:** embedded MKV subtitles, embedded ASS/SSA rendering or switching — the engine does not expose embedded subtitle tracks. There is no Subtitles option in the app.

### Audio tracks — limitation (honest)

Embedded MKV audio-track switching is **not supported** on this device. The KaiOS 2.5 (Gecko 48) media engine does not expose embedded audio track lists, so MS Player cannot enumerate or switch Hindi AAC / English Opus / Japanese tracks, and it never fakes a switch. There is no Audio tracks option in the app. The video plays with its default audio track — to hear another language, use a file whose default audio track is that language.

## Keypad shortcuts

| Key | Action |
|---|---|
| `0` | Player options menu |
| `1` | Rotate −10° (hold ≥1s: seek −200s) |
| `3` | Rotate +10° (hold ≥1s: seek +200s) |
| `4` | Speed −0.1 (hold ≥1s: rotate −10°) |
| `6` | Speed +0.1 (hold ≥1s: rotate +10°) |
| `5` | Restore defaults (hold ≥1s: repeat on/off) |
| `7` | Back to video list |
| `9` | Jump-to-time dialog (hold ≥1s: restart) |
| `2` | Speed reset to 1.0x |
| `*` | Zoom out |
| `#` | Zoom in |
| `Enter` | Play / Pause (or activate focused item) |
| `Up` / `Down` | Volume up / down (in player); move focus (in lists); scroll (Help / Details dialogs); move between fields (Settings) |
| `Left` / `Right` | Seek −10s / +10s (in player); text cursor (inside a text input) |
| `Call` / `s` | Screenshot (saved to pictures storage, best-effort) |
| `LSK` | Fullscreen / primary action |
| `RSK` | Restore / secondary action / Back |
| Digits (in lists) | Jump to the Nth file (type the number, pause ~0.9s) |

Text inputs are never disturbed by shortcuts: digits type into the field, and only Softkeys / Enter / list navigation apply there.

## Screens

Home, Continue Watching, Video library, Search/filter, Selected video options menu, Playback, Player options menu, Jump-to-time dialog, Video details, Settings, Help / shortcuts, Unsupported-feature dialog, Empty-library screen, Loading, Playback error, Missing-file, Reset confirmation, History-clearing confirmation, Hidden Files. All are real, connected, and reachable. (Audio track selection and Subtitle selection screens were removed in v1.0.1 because embedded switching does not work on this runtime.)

## Technologies used

- **Vanilla HTML, CSS, and ES5 JavaScript** — no framework, no build system, no network, no ads, no tracking
- **KaiOS 2.5, privileged app type** — `manifest.webapp` with `storage`, `audio-channel-content`, `device-storage:sdcard` / `device-storage:sdcard1` / `device-storage:videos` / `device-storage:pictures` (read/write), `feature-detection`
- **DeviceStorage API** — video library scan, Hide/Unhide, external subtitles
- **HTML5 video element** — single video element for playback (+ hidden audio element for background play, + one audio element only for `.mpa` split playback)
- **MozActivity** — `view`, `open`, and `share` for receiving videos from other apps
- **localStorage** — settings (`msplayer_settings_v1`), history (`msplayer_history_v1`), hidden index (`msplayer_hidden_v1`)
- **Node.js** — syntax checks and the manual device-test checklist under `tests/`

## Project structure

```text
ms-player/
├── manifest.webapp            # KaiOS manifest (v1.0.1, privileged, activities, icons)
├── index.html                 # Single-page app: all screens + dialogs
├── README.md
├── LICENSE                    # MIT (Mesbaul Islam)
├── css/
│   ├── style.css              # Base styles, menus, lists, inputs, footer
│   ├── layout.css             # Layout helpers, help/details text
│   ├── player.css             # Player stage, subtitle bar, progress bar
│   └── dialogs.css            # Dialog overlay + box
├── js/
│   ├── app.js                 # Startup: settings, activities, lock gate, Home
│   ├── navigation.js          # Screen router + the single global key handler
│   ├── player.js              # Playback engine (single video element)
│   ├── video-library.js       # DeviceStorage scan, Hide/Unhide (hdn-svid/)
│   ├── file-handler.js        # view/open/share activity handling
│   ├── subtitles.js           # External .vtt (first) / .srt silent auto-load + rendering
│   ├── history.js             # Continue Watching + saved positions (metadata only)
│   ├── settings.js            # Persistent settings (localStorage), safe defaults
│   ├── media-capabilities.js  # Honest capability detection (embedded tracks: NO)
│   └── utils.js               # DOM/text/time/size helpers, PIN hash, .mpa splitter
├── assets/
│   ├── icon-original.png      # Supplied icon, copied verbatim (1254x1254 RGBA PNG)
│   ├── icon-56.png            # Lanczos resize of the same artwork
│   ├── icon-112.png           # Lanczos resize of the same artwork
│   └── icon-128.png           # Lanczos resize of the same artwork
└── tests/
    └── README.md              # Manual checklist for the Energizer E241S
```

## Installation and setup

```bash
git clone https://github.com/mesbaulislam/ms-player.git
cd ms-player
```

1. ZIP the project root, so `manifest.webapp` is at the ZIP root:

   ```bash
   zip -r ../ms-player-v1.0.1.zip .
   ```

   Do NOT zip the parent folder (that nests the project one level deep and breaks the store installer). Verify with `zipinfo` / `unzip -l` that `manifest.webapp` is at the root and every referenced file is present.
2. Install the ZIP on a KaiOS 2.5 device via KaiStore Personal Testing as a **Privileged** app, or sideload it with WebIDE.
3. The delivered ZIP is **unsigned** — KaiStore Personal Testing signing requirements could not be verified from the build environment; do not claim the package is signed.

## Usage

1. Open **MS Player** — Home shows Continue Watching and the video library.
2. Browse with the D-pad, press OK to play. Use the shortcut keys above for speed, zoom, rotate, seek, and jump-to-time.
3. To play a video from a file manager: select the video → Options → Share → MS Player (or Open With → MS Player). It plays immediately, with resume offered when a position is saved.
4. Put an external subtitle file beside the video with the same basename (`movie.vtt` or `movie.srt`) — it loads automatically, with no menu to enable.
5. Open Settings to change scan extensions, background playback, Auto Scale, or the app lock PIN.

## Tests

`tests/README.md` is a manual checklist for the Energizer E241S — no device testing was performed in the build environment. Run every item on the real phone, especially: icon launch, File Manager Share flow, MP4 / 3GP / MKV / MPA playback, subtitles, and the install-error check. If installation fails, capture the exact on-device error text and any installer log.

Static checks that do pass: `node --check` on all ten JS files, manifest JSON validity, and referenced-file existence (no empty files, no dead imports, no unused libraries, no fake video entries).

## Screenshots

No screenshots are bundled in this repository.

## Known platform restrictions

- No embedded MKV audio/subtitle track access; no ASS/SSA rendering.
- Decode support depends on the device codecs; an accepted extension is not a guarantee of playback.
- Screenshots depend on canvas capture + pictures storage; best-effort.
- `window.close()` behaviour on KaiOS depends on how the app was launched; RSK "Exit"/"Close" attempts it but the system may keep the app alive.
- DeviceStorage paths are volume-dependent; enumerated names are used verbatim for `get()` / `delete()`.
- `.mpa` split playback, background audio handoff, and screenshot saving are experimental (sync is best-effort).

## Developer

**Mesbaul Islam** — [@mesbaulislam](https://github.com/mesbaulislam)

© 2026 MS Player
