/* MS Player - player.js. Single video element (+ hidden bg audio element,
   + one audio element only for .mpa split playback). Playback state is kept
   when menus/dialogs open: menus never stop the video. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.player = {};
MSP.player.current = null; /* {name,size,type,lastModified,blob} */
MSP.player.isMpa = false;
MSP.player.scale = 1;
MSP.player.rotate = 0;
MSP.player.fullscreen = false;
MSP.player.prevScale = 1;
MSP.player.prevRotate = 0;
MSP.player.repeat = false;
MSP.player.muted = false;
MSP.player.progressTimer = null;
MSP.player.toastTimer = null;
MSP.player.overlayTimer = null;
MSP.player.OVERLAY_MS = 3000; /* auto-hide overlays after 3s of no key */
MSP.player.objectUrls = [];
MSP.player.lastSaveAt = 0;
MSP.player.bgActive = false;

MSP.player.video = function () { return MSP.utils.$('playerVideo'); };
MSP.player.bgAudioEl = function () { return MSP.utils.$('bgAudio'); };
MSP.player.mpaAudioEl = function () { return MSP.utils.$('mpaAudio'); };
MSP.player.stage = function () { return MSP.utils.$('playerStage'); };

MSP.player.toast = function (msg) {
  var t = MSP.utils.$('playerToast');
  if (!t) { return; }
  MSP.utils.setText(t, msg);
  MSP.utils.removeClass(t, 'hidden');
  if (MSP.player.toastTimer) { clearTimeout(MSP.player.toastTimer); }
  MSP.player.toastTimer = setTimeout(function () { MSP.utils.addClass(t, 'hidden'); }, 2200);
};
/* ---- overlay auto-hide (S-Vid-like compact player) ----
   Top title bar + bottom progress/time bar hide after 3s of no key while
   playing, so the video fills the screen. Any key re-shows them
   (navigation.js calls showOverlays on every player key). While paused,
   or while a dialog is open, overlays stay visible. Subtitles never hide. */
MSP.player.showOverlays = function () {
  var stage = MSP.player.stage();
  if (!stage) { return; }
  MSP.utils.removeClass(stage, 'overlays-hidden');
  if (MSP.player.overlayTimer) { clearTimeout(MSP.player.overlayTimer); MSP.player.overlayTimer = null; }
  MSP.player.overlayTimer = setTimeout(function () { MSP.player.hideOverlays(); }, MSP.player.OVERLAY_MS);
};
MSP.player.hideOverlays = function () {
  var stage = MSP.player.stage();
  if (!stage) { return; }
  var v = MSP.player.video();
  if (MSP.nav.dialog) { return; } /* dialog open: keep overlays visible */
  if (v && v.paused) { return; } /* paused: keep controls visible */
  MSP.utils.addClass(stage, 'overlays-hidden');
};
MSP.player.revokeUrls = function () {
  var i;
  for (i = 0; i < MSP.player.objectUrls.length; i++) {
    try { URL.revokeObjectURL(MSP.player.objectUrls[i]); } catch (e) { /* ignore */ }
  }
  MSP.player.objectUrls = [];
};
MSP.player.applyTransform = function () {
  var v = MSP.player.video();
  if (!v) { return; }
  v.style.transform = 'scale(' + MSP.player.scale.toFixed(2) + ') rotate(' + MSP.player.rotate + 'deg)';
};
MSP.player.updateLabels = function () {
  var v = MSP.player.video();
  if (!v) { return; }
  MSP.utils.setText(MSP.utils.$('playerTime'),
    MSP.utils.formatTime(v.currentTime || 0) + ' / ' + MSP.utils.formatTime(v.duration || 0));
  /* ONE combined line: speed + zoom, separated, never duplicated/overlapped. */
  var rate = v.playbackRate || 1;
  MSP.utils.setText(MSP.utils.$('playerMeta'), rate.toFixed(1) + 'x · ' + MSP.player.scale.toFixed(1) + 'x');
  var bar = MSP.utils.$('playerProgress');
  if (bar && v.duration) { bar.style.width = Math.min(100, (v.currentTime / v.duration) * 100) + '%'; }
  if (MSP.player.current) { MSP.utils.setText(MSP.utils.$('playerFileName'), MSP.utils.displayName(MSP.player.current.name)); }
};
MSP.player.updateSubtitles = function () {
  var bar = MSP.utils.$('subtitleBar');
  if (!bar) { return; }
  var v = MSP.player.video();
  if (!MSP.subtitles.enabled || MSP.subtitles.selected === 'off' || !v) {
    MSP.utils.setText(bar, '');
    return;
  }
  MSP.utils.setText(bar, MSP.subtitles.forTime(MSP.subtitles.current, v.currentTime || 0));
};
MSP.player.savePosition = function () {
  var v = MSP.player.video();
  if (!v || !MSP.player.current) { return; }
  if (v.duration && v.currentTime > 0 && v.currentTime < v.duration - 2) {
    MSP.history.upsert(MSP.player.current, v.currentTime, v.duration);
  }
};
MSP.player.startProgress = function () {
  MSP.player.stopProgress();
  MSP.player.progressTimer = setInterval(function () {
    MSP.player.updateLabels();
    MSP.player.updateSubtitles();
    var now = new Date().getTime();
    if (now - MSP.player.lastSaveAt > 5000) {
      MSP.player.lastSaveAt = now;
      MSP.player.savePosition();
    }
  }, 500);
};
MSP.player.stopProgress = function () {
  if (MSP.player.progressTimer) { clearInterval(MSP.player.progressTimer); MSP.player.progressTimer = null; }
};
MSP.player.cleanup = function () {
  MSP.player.stopProgress();
  MSP.player.savePosition();
  if (MSP.player.overlayTimer) { clearTimeout(MSP.player.overlayTimer); MSP.player.overlayTimer = null; }
  var st = MSP.player.stage();
  if (st) { MSP.utils.removeClass(st, 'overlays-hidden'); }
  var v = MSP.player.video();
  var bg = MSP.player.bgAudioEl();
  var ma = MSP.player.mpaAudioEl();
  try { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } } catch (e) { /* ignore */ }
  try { if (bg) { bg.pause(); bg.removeAttribute('src'); } } catch (e2) { /* ignore */ }
  try { if (ma) { ma.pause(); ma.removeAttribute('src'); } } catch (e3) { /* ignore */ }
  MSP.player.revokeUrls();
  MSP.player.bgActive = false;
  MSP.player.isMpa = false;
  MSP.player.exitFullscreen(true);
  MSP.utils.setText(MSP.utils.$('subtitleBar'), '');
};
MSP.player.openFile = function (fileInfo, opts) {
  opts = opts || {};
  if (!fileInfo || !fileInfo.blob) {
    MSP.nav.showError('No video file to play.');
    return;
  }
  MSP.player.cleanup();
  MSP.player.current = fileInfo;
  MSP.nav.showScreen('player');
  MSP.player.showOverlays();
  MSP.nav.setSoftkeys('Fullscreen', 'Pause', 'Restore');
  MSP.utils.setText(MSP.utils.$('headerTitle'), MSP.utils.displayName(fileInfo.name));
  MSP.utils.setText(MSP.utils.$('playerFileName'), MSP.utils.displayName(fileInfo.name));
  MSP.nav.showLoading('Loading video...');
  var ext = MSP.utils.extOf(fileInfo.name);
  if (ext === 'mpa') {
    MSP.player.openMpa(fileInfo, opts);
  } else {
    MSP.player.openNormal(fileInfo, opts);
  }
};
MSP.player.openNormal = function (fileInfo, opts) {
  var v = MSP.player.video();
  var url = null;
  try { url = URL.createObjectURL(fileInfo.blob); } catch (e) {
    MSP.nav.hideLoading();
    MSP.nav.showError('Could not open this file: ' + e.message);
    return;
  }
  MSP.player.objectUrls.push(url);
  MSP.player.isMpa = false;
  try { v.src = url; } catch (e2) {
    MSP.nav.hideLoading();
    MSP.nav.showError('Could not open this file.');
    return;
  }
  MSP.player.finishOpen(fileInfo, opts);
};
MSP.player.openMpa = function (fileInfo, opts) {
  var reader = null;
  try { reader = new FileReader(); } catch (e) {
    MSP.nav.hideLoading();
    MSP.nav.showError('Could not read this .mpa file.');
    return;
  }
  reader.onload = function () {
    var split = null;
    try { split = MSP.utils.splitMpa(reader.result); } catch (e2) { split = null; }
    if (!split || !split.found) {
      /* No separator: fall back to normal playback of the whole file. */
      MSP.player.toast('.mpa separator not found - trying normal playback');
      MSP.player.openNormal(fileInfo, opts);
      return;
    }
    var v = MSP.player.video();
    var ma = MSP.player.mpaAudioEl();
    var videoUrl = URL.createObjectURL(new Blob([split.video], { type: 'video/mp4' }));
    var audioUrl = URL.createObjectURL(new Blob([split.audio], { type: 'audio/mp4' }));
    MSP.player.objectUrls.push(videoUrl);
    MSP.player.objectUrls.push(audioUrl);
    MSP.player.isMpa = true;
    try {
      v.muted = true; /* audio comes from the separate audio element */
      v.src = videoUrl;
      ma.src = audioUrl;
    } catch (e3) {
      MSP.nav.hideLoading();
      MSP.nav.showError('Could not open this .mpa file.');
      return;
    }
    MSP.player.finishOpen(fileInfo, opts);
  };
  reader.onerror = function () {
    MSP.nav.hideLoading();
    MSP.nav.showError('Could not read this .mpa file.');
  };
  try { reader.readAsArrayBuffer(fileInfo.blob); } catch (e4) {
    MSP.nav.hideLoading();
    MSP.nav.showError('Could not read this .mpa file.');
  }
};
MSP.player.finishOpen = function (fileInfo, opts) {
  var v = MSP.player.video();
  var resumeAt = 0;
  if (opts.resume) { resumeAt = MSP.history.positionFor(fileInfo.name); }
  var onMeta = function () {
    MSP.nav.hideLoading();
    if (MSP.settings.current && MSP.settings.current.autoScale) {
      try { v.style.width = '100%'; v.style.height = '100%'; } catch (e) { /* ignore */ }
    }
    if (resumeAt > 0 && resumeAt < (v.duration || 0)) {
      try { v.currentTime = resumeAt; } catch (e2) { /* ignore */ }
      MSP.player.toast('Resumed at ' + MSP.utils.formatTime(resumeAt));
    }
    MSP.player.play();
    MSP.player.syncMpa(true);
  };
  v.onloadedmetadata = onMeta;
  v.onerror = function () {
    MSP.nav.hideLoading();
    MSP.nav.showError('Playback failed. The file may use a codec this device cannot decode, or the file may be damaged.');
  };
  v.onended = function () {
    if (MSP.player.repeat) {
      try { v.currentTime = 0; v.play(); } catch (e) { /* ignore */ }
      MSP.player.syncMpa(true);
      return;
    }
    MSP.history.upsert(fileInfo, 0, v.duration || 0);
    MSP.player.toast('Finished');
  };
  MSP.player.startProgress();
  MSP.subtitles.loadExternal(fileInfo.name, function (kind) {
    if (kind) { MSP.player.toast('Subtitles found (.' + kind + ')'); }
  });
};
MSP.player.syncMpa = function (force) {
  if (!MSP.player.isMpa) { return; }
  var v = MSP.player.video();
  var ma = MSP.player.mpaAudioEl();
  if (!v || !ma) { return; }
  try {
    if (force || Math.abs(ma.currentTime - v.currentTime) > 0.5) { ma.currentTime = v.currentTime; }
    if (v.paused) { ma.pause(); } else { ma.play(); }
  } catch (e) { /* ignore */ }
};
MSP.player.play = function () {
  var v = MSP.player.video();
  try { v.play(); } catch (e) { /* ignore */ }
  MSP.player.syncMpa(false);
  MSP.nav.setSoftkeys(MSP.player.fullscreen ? 'Exit Full' : 'Fullscreen', 'Pause', 'Restore');
};
MSP.player.pause = function () {
  var v = MSP.player.video();
  try { v.pause(); } catch (e) { /* ignore */ }
  var ma = MSP.player.mpaAudioEl();
  try { if (ma) { ma.pause(); } } catch (e2) { /* ignore */ }
  MSP.nav.setSoftkeys(MSP.player.fullscreen ? 'Exit Full' : 'Fullscreen', 'Play', 'Restore');
};
MSP.player.togglePlay = function () {
  var v = MSP.player.video();
  if (!v) { return; }
  MSP.player.showOverlays();
  if (v.paused) { MSP.player.play(); MSP.player.toast('Playing'); }
  else { MSP.player.pause(); MSP.player.toast('Paused'); }
  MSP.player.savePosition();
};
MSP.player.seekBy = function (secs) {
  var v = MSP.player.video();
  if (!v) { return; }
  MSP.player.showOverlays();
  var target = (v.currentTime || 0) + secs;
  if (target < 0) { target = 0; }
  if (v.duration && target > v.duration) { target = v.duration; }
  try { v.currentTime = target; } catch (e) { /* ignore */ }
  MSP.player.syncMpa(true);
  MSP.player.updateLabels();
};
MSP.player.jumpTo = function (secs) {
  var v = MSP.player.video();
  if (!v) { return false; }
  MSP.player.showOverlays();
  if (!v.duration || secs < 0 || secs >= v.duration) { return false; }
  try { v.currentTime = secs; } catch (e) { return false; }
  MSP.player.syncMpa(true);
  MSP.player.updateLabels();
  return true;
};
MSP.player.restart = function () {
  var v = MSP.player.video();
  if (!v) { return; }
  MSP.player.showOverlays();
  try { v.currentTime = 0; v.play(); } catch (e) { /* ignore */ }
  MSP.player.syncMpa(true);
  MSP.player.toast('Restarted');
};
MSP.player.volumeUp = function () {
  var nav = window.navigator;
  if (nav && nav.volumeManager && nav.volumeManager.requestUp) {
    try { nav.volumeManager.requestUp(); return; } catch (e) { /* fall through */ }
  }
  var v = MSP.player.video();
  if (v) { try { v.volume = Math.min(1, (v.volume || 0) + 0.1); } catch (e2) { /* ignore */ } }
};
MSP.player.volumeDown = function () {
  var nav = window.navigator;
  if (nav && nav.volumeManager && nav.volumeManager.requestDown) {
    try { nav.volumeManager.requestDown(); return; } catch (e) { /* fall through */ }
  }
  var v = MSP.player.video();
  if (v) { try { v.volume = Math.max(0, (v.volume || 0) - 0.1); } catch (e2) { /* ignore */ } }
};
MSP.player.toggleMute = function () {
  var v = MSP.player.video();
  var ma = MSP.player.mpaAudioEl();
  MSP.player.showOverlays();
  MSP.player.muted = !MSP.player.muted;
  try { if (v) { v.muted = MSP.player.muted; } } catch (e) { /* ignore */ }
  try { if (ma) { ma.muted = MSP.player.muted; } } catch (e2) { /* ignore */ }
  MSP.player.toast(MSP.player.muted ? 'Muted' : 'Unmuted');
};
MSP.player.setSpeed = function (delta) {
  var v = MSP.player.video();
  if (!v) { return; }
  MSP.player.showOverlays();
  var next = (v.playbackRate || 1) + delta;
  if (next < 0.5) { next = 0.5; }
  if (next > 2.0) { next = 2.0; }
  try { v.playbackRate = next; } catch (e) { /* ignore */ }
  MSP.player.toast('Speed ' + next.toFixed(1) + 'x');
  MSP.player.updateLabels();
};
MSP.player.resetSpeed = function () {
  var v = MSP.player.video();
  if (!v) { return; }
  MSP.player.showOverlays();
  try { v.playbackRate = 1; } catch (e) { /* ignore */ }
  MSP.player.toast('Speed 1.0x');
  MSP.player.updateLabels();
};
MSP.player.zoomIn = function () {
  MSP.player.showOverlays();
  MSP.player.scale = Math.min(3, MSP.player.scale + 0.1);
  MSP.player.applyTransform();
  MSP.player.toast('Zoom ' + MSP.player.scale.toFixed(1) + 'x');
  MSP.player.updateLabels();
};
MSP.player.zoomOut = function () {
  MSP.player.showOverlays();
  MSP.player.scale = Math.max(0.5, MSP.player.scale - 0.1);
  MSP.player.applyTransform();
  MSP.player.toast('Zoom ' + MSP.player.scale.toFixed(1) + 'x');
  MSP.player.updateLabels();
};
MSP.player.rotateBy = function (deg) {
  MSP.player.showOverlays();
  MSP.player.rotate += deg;
  if (MSP.player.rotate > 360) { MSP.player.rotate -= 360; }
  if (MSP.player.rotate < -360) { MSP.player.rotate += 360; }
  MSP.player.applyTransform();
  MSP.player.toast('Rotate ' + MSP.player.rotate + ' deg');
};
MSP.player.restoreDefaults = function () {
  MSP.player.showOverlays();
  MSP.player.scale = 1;
  MSP.player.rotate = 0;
  MSP.player.applyTransform();
  MSP.player.resetSpeed();
  MSP.player.toast('Default playback');
};
MSP.player.toggleRepeat = function () {
  MSP.player.showOverlays();
  MSP.player.repeat = !MSP.player.repeat;
  MSP.player.toast(MSP.player.repeat ? 'Repeat On' : 'Repeat Off');
};
MSP.player.enterFullscreen = function () {
  var stage = MSP.player.stage();
  MSP.player.prevScale = MSP.player.scale;
  MSP.player.prevRotate = MSP.player.rotate;
  MSP.player.fullscreen = true;
  MSP.utils.addClass(stage, 'fullscreen');
  MSP.player.scale = 1.36;
  MSP.player.rotate = 90;
  MSP.player.applyTransform();
  MSP.nav.setSoftkeys('Exit Full', MSP.player.video().paused ? 'Play' : 'Pause', 'Restore');
  MSP.player.showOverlays();
  MSP.player.toast('Fullscreen');
};
MSP.player.exitFullscreen = function (silent) {
  if (!MSP.player.fullscreen && !silent) { return; }
  var stage = MSP.player.stage();
  MSP.player.fullscreen = false;
  MSP.utils.removeClass(stage, 'fullscreen');
  MSP.player.scale = MSP.player.prevScale;
  MSP.player.rotate = MSP.player.prevRotate;
  MSP.player.applyTransform();
  if (!silent) {
    MSP.nav.setSoftkeys('Fullscreen', MSP.player.video().paused ? 'Play' : 'Pause', 'Restore');
    MSP.player.showOverlays();
    MSP.player.toast('Exited fullscreen');
  }
};
MSP.player.toggleFullscreen = function () {
  if (MSP.player.fullscreen) { MSP.player.exitFullscreen(false); }
  else { MSP.player.enterFullscreen(); }
};
MSP.player.screenshot = function () {
  var v = MSP.player.video();
  if (!v || !v.videoWidth) {
    MSP.player.toast('Screenshot not available');
    return;
  }
  var canvas = null;
  try { canvas = document.createElement('canvas'); } catch (e) {
    MSP.player.toast('Screenshot not supported');
    return;
  }
  canvas.width = v.videoWidth;
  canvas.height = v.videoHeight;
  try {
    var ctx = canvas.getContext('2d');
    ctx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight);
  } catch (e2) {
    MSP.player.toast('Screenshot failed');
    return;
  }
  var saveBlob = function (blob) {
    if (!blob) { MSP.player.toast('Screenshot failed'); return; }
    try {
      var pics = window.navigator.getDeviceStorage('pictures');
      var name = 'MS-Player/screenshot-' + new Date().getTime() + '.jpg';
      var req = pics.addNamed(blob, name);
      req.onsuccess = function () { MSP.player.toast('Screenshot saved'); };
      req.onerror = function () { MSP.player.toast('Screenshot save failed'); };
    } catch (e3) { MSP.player.toast('Screenshot save failed'); }
  };
  try {
    if (canvas.toBlob) { canvas.toBlob(saveBlob, 'image/jpeg', 0.85); }
    else { MSP.player.toast('Screenshot not supported'); }
  } catch (e4) { MSP.player.toast('Screenshot failed'); }
};
/* Background playback: when the app is hidden and the setting is on,
   a hidden <audio mozaudiochannel="content"> keeps the audio going.
   Otherwise the video simply pauses. */
MSP.player.onVisibilityChange = function () {
  var v = MSP.player.video();
  if (!v || !MSP.player.current) { return; }
  var bg = MSP.player.bgAudioEl();
  if (document.hidden) {
    if (MSP.settings.current && MSP.settings.current.bgPlay && bg && !MSP.player.isMpa) {
      try {
        bg.src = v.src;
        bg.currentTime = v.currentTime;
        bg.play();
        MSP.player.bgActive = true;
        v.pause();
        return;
      } catch (e) { /* fall through to pause */ }
    }
    try { v.pause(); } catch (e2) { /* ignore */ }
    MSP.player.savePosition();
  } else {
    if (MSP.player.bgActive && bg) {
      try {
        v.currentTime = bg.currentTime;
        bg.pause();
        bg.removeAttribute('src');
      } catch (e3) { /* ignore */ }
      MSP.player.bgActive = false;
      try { v.play(); } catch (e4) { /* ignore */ }
    }
  }
};
MSP.player.details = function () {
  var f = MSP.player.current;
  var v = MSP.player.video();
  if (!f) { return null; }
  var res = 'Unknown';
  if (v && v.videoWidth && v.videoHeight) { res = v.videoWidth + ' x ' + v.videoHeight; }
  return {
    filename: MSP.utils.displayName(f.name),
    path: f.name,
    size: MSP.utils.formatSize(f.size),
    type: f.type || MSP.utils.extOf(f.name) || 'Unknown',
    resolution: res,
    duration: v && v.duration ? MSP.utils.formatTime(v.duration) : 'Unknown',
    lastModified: f.lastModified ? MSP.utils.formatDate(f.lastModified) : 'Unknown',
    audio: 'Default audio track (embedded track switching not supported on this device)',
    subtitles: MSP.subtitles.available.length > 1 ? MSP.subtitles.available.map(function (a) { return a.label; }).join(', ') + ' (auto-loaded)' : 'None found (external .vtt / .srt auto-load only)'
  };
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.player; }
