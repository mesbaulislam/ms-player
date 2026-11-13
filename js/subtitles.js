/* MS Player - subtitles.js. External .vtt (tried first) then .srt.
   Parsing is defensive: malformed lines are skipped, never crash.
   Subtitle text is rendered with textContent only (no HTML injection).
   Embedded MKV subtitles (incl. ASS/SSA) are NOT supported on this runtime. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.subtitles = {};
MSP.subtitles.current = []; /* [{start,end,text}] */
MSP.subtitles.enabled = true;
MSP.subtitles.available = []; /* [{label, kind}] e.g. Off, External VTT, External SRT */
MSP.subtitles.selected = 'off'; /* 'off' | 'vtt' | 'srt' */

MSP.subtitles.parseTimeToSeconds = function (text) {
  var t = String(text || '').replace(/^\s+|\s+$/g, '').replace(',', '.');
  var m = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(t);
  if (!m) { return -1; }
  var h = m[1] ? parseInt(m[1], 10) : 0;
  var mi = parseInt(m[2], 10);
  var s = parseInt(m[3], 10);
  var frac = 0;
  if (m[4]) {
    var f = m[4];
    while (f.length < 3) { f += '0'; }
    frac = parseInt(f.substring(0, 3), 10) / 1000;
  }
  if (mi > 59 || s > 59) { return -1; }
  return h * 3600 + mi * 60 + s + frac;
};
MSP.subtitles.parseVTT = function (text) {
  var lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var out = [];
  var cur = null;
  var i, line, parts, start, end;
  for (i = 0; i < lines.length; i++) {
    line = lines[i];
    if (line.indexOf('-->') !== -1) {
      if (cur && cur.text) { out.push(cur); }
      parts = line.split('-->');
      start = MSP.subtitles.parseTimeToSeconds(parts[0]);
      end = parts.length > 1 ? MSP.subtitles.parseTimeToSeconds(parts[1]) : -1;
      cur = (start >= 0 && end >= 0) ? { start: start, end: end, text: '' } : null;
    } else if (cur && line.replace(/^\s+|\s+$/g, '') !== '' && line.indexOf('WEBVTT') !== 0 && !/^\d+$/.test(line.replace(/^\s+|\s+$/g, ''))) {
      cur.text += (cur.text ? ' ' : '') + line.replace(/^\s+|\s+$/g, '');
    } else if (cur && line.replace(/^\s+|\s+$/g, '') === '') {
      if (cur.text) { out.push(cur); }
      cur = null;
    }
  }
  if (cur && cur.text) { out.push(cur); }
  return out;
};
MSP.subtitles.parseSRT = function (text) {
  var lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var out = [];
  var cur = null;
  var i, line, parts, start, end;
  var push = function () {
    if (cur && cur.timed && cur.text) { out.push({ start: cur.start, end: cur.end, text: cur.text }); }
  };
  for (i = 0; i < lines.length; i++) {
    line = lines[i];
    if (/^\d+$/.test(line.replace(/^\s+|\s+$/g, ''))) {
      push();
      cur = { start: 0, end: 0, text: '', timed: false };
    } else if (line.indexOf('-->') !== -1) {
      if (!cur) { cur = { start: 0, end: 0, text: '', timed: false }; }
      parts = line.split('-->');
      start = MSP.subtitles.parseTimeToSeconds(parts[0]);
      end = parts.length > 1 ? MSP.subtitles.parseTimeToSeconds(parts[1]) : -1;
      if (start >= 0 && end >= 0) { cur.start = start; cur.end = end; cur.timed = true; }
    } else if (cur && line.replace(/^\s+|\s+$/g, '') !== '') {
      cur.text += (cur.text ? ' ' : '') + line.replace(/^\s+|\s+$/g, '');
    } else if (cur && line.replace(/^\s+|\s+$/g, '') === '') {
      push();
      cur = null;
    }
  }
  push();
  return out;
};
MSP.subtitles.forTime = function (list, t) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (t >= list[i].start && t <= list[i].end) { return list[i].text; }
  }
  return '';
};
MSP.subtitles.reset = function () {
  MSP.subtitles.current = [];
  MSP.subtitles.available = [{ label: 'Off', kind: 'off' }];
  MSP.subtitles.selected = 'off';
  MSP.subtitles.enabled = false;
};
/* Try .vtt first, then .srt beside the video (same basename). Calls cb(kind|null). */
MSP.subtitles.loadExternal = function (fileName, cb) {
  MSP.subtitles.reset();
  if (!window.navigator || !window.navigator.getDeviceStorages) { if (cb) { cb(null); } return; }
  var storages = [];
  try { storages = window.navigator.getDeviceStorages('sdcard'); } catch (e) { storages = []; }
  if (!storages || storages.length === 0) {
    try { storages = [window.navigator.getDeviceStorage('sdcard')]; } catch (e2) { storages = []; }
  }
  var tryIndex = 0;
  var tryOne = function () {
    if (tryIndex >= storages.length) { if (cb) { cb(null); } return; }
    var sd = storages[tryIndex++];
    if (!sd) { tryOne(); return; }
    var req = null;
    try { req = sd.get(MSP.utils.replaceExt(fileName, 'vtt')); } catch (e) { tryOne(); return; }
    if (!req) { tryOne(); return; }
    req.onsuccess = function () {
      var f = req.result;
      if (!f) { trySrt(sd); return; }
      MSP.subtitles.readFile(f, 'vtt', function (ok) {
        if (ok) { if (cb) { cb('vtt'); } }
        else { trySrt(sd); }
      });
    };
    req.onerror = function () { trySrt(sd); };
  };
  var trySrt = function (sd) {
    var req = null;
    try { req = sd.get(MSP.utils.replaceExt(fileName, 'srt')); } catch (e) { tryOne(); return; }
    if (!req) { tryOne(); return; }
    req.onsuccess = function () {
      var f = req.result;
      if (!f) { tryOne(); return; }
      MSP.subtitles.readFile(f, 'srt', function (ok) { if (cb) { cb(ok ? 'srt' : null); } else { tryOne(); } });
    };
    req.onerror = function () { tryOne(); };
  };
  tryOne();
};
MSP.subtitles.readFile = function (file, kind, cb) {
  var reader = null;
  try { reader = new FileReader(); } catch (e) { if (cb) { cb(false); } return; }
  reader.onload = function () {
    try {
      var parsed = kind === 'vtt' ? MSP.subtitles.parseVTT(reader.result) : MSP.subtitles.parseSRT(reader.result);
      if (parsed.length === 0) { if (cb) { cb(false); } return; }
      MSP.subtitles.current = parsed;
      MSP.subtitles.available.push({ label: kind === 'vtt' ? 'External subtitles (.vtt)' : 'External subtitles (.srt)', kind: kind });
      MSP.subtitles.selected = kind;
      MSP.subtitles.enabled = true;
      if (cb) { cb(true); }
    } catch (e2) { if (cb) { cb(false); } }
  };
  reader.onerror = function () { if (cb) { cb(false); } };
  try { reader.readAsText(file); } catch (e3) { if (cb) { cb(false); } }
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.subtitles; }
