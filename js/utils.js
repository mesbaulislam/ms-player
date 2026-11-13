/* MS Player - utils.js. Small ES5 helpers. No framework. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.utils = {};

MSP.utils.$ = function (id) { return document.getElementById(id); };
MSP.utils.hasClass = function (el, name) {
  if (!el) { return false; }
  return (' ' + el.className + ' ').indexOf(' ' + name + ' ') !== -1;
};
MSP.utils.addClass = function (el, name) {
  if (el && !MSP.utils.hasClass(el, name)) { el.className = (el.className + ' ' + name).replace(/^\s+/, ''); }
};
MSP.utils.removeClass = function (el, name) {
  if (!el) { return; }
  el.className = (' ' + el.className + ' ').replace(' ' + name + ' ', ' ').replace(/^\s+|\s+$/g, '');
};
/* Set text safely: never use innerHTML with filenames or subtitle text. */
MSP.utils.setText = function (el, text) {
  if (!el) { return; }
  while (el.firstChild) { el.removeChild(el.firstChild); }
  el.appendChild(document.createTextNode(text === null || text === undefined ? '' : String(text)));
};
MSP.utils.baseName = function (path) {
  var p = String(path || '');
  var i = p.lastIndexOf('/');
  return i >= 0 ? p.substring(i + 1) : p;
};
MSP.utils.extOf = function (name) {
  var b = MSP.utils.baseName(name);
  var i = b.lastIndexOf('.');
  if (i < 0) { return ''; }
  return b.substring(i + 1).toLowerCase();
};
MSP.utils.replaceExt = function (name, newExt) {
  var i = String(name).lastIndexOf('.');
  if (i < 0) { return name + '.' + newExt; }
  return String(name).substring(0, i + 1) + newExt;
};
/* Display-only decoding of URL-encoded filenames. Original path is never altered. */
MSP.utils.displayName = function (name) {
  var out = MSP.utils.baseName(name);
  try { out = decodeURIComponent(out); } catch (e) { /* keep raw name on bad encoding */ }
  return out;
};
/* Display-only decoding of a FULL path (e.g. /sdcard1/Anime/Bleach%20S03...).
   Internal stored path stays verbatim; only what the user sees is decoded. */
MSP.utils.displayPath = function (path) {
  var out = String(path || '');
  try { out = decodeURIComponent(out); } catch (e) { /* keep raw path on bad encoding */ }
  return out;
};
MSP.utils.formatSize = function (bytes) {
  var n = Number(bytes);
  if (isNaN(n) || n < 0) { return 'Unknown'; }
  if (n < 1024) { return n + ' B'; }
  if (n < 1024 * 1024) { return (n / 1024).toFixed(1) + ' KB'; }
  if (n < 1024 * 1024 * 1024) { return (n / (1024 * 1024)).toFixed(1) + ' MB'; }
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};
MSP.utils.pad2 = function (n) { return n < 10 ? '0' + n : String(n); };
MSP.utils.formatTime = function (secs) {
  var s = Math.floor(Number(secs));
  if (isNaN(s) || s < 0) { s = 0; }
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var r = s % 60;
  return MSP.utils.pad2(h) + ':' + MSP.utils.pad2(m) + ':' + MSP.utils.pad2(r);
};
MSP.utils.parseHMS = function (text) {
  var m = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/.exec(String(text || '').replace(/^\s+|\s+$/g, ''));
  if (!m) { return -1; }
  var h = parseInt(m[1], 10), mi = parseInt(m[2], 10), s = parseInt(m[3], 10);
  if (mi > 59 || s > 59) { return -1; }
  return h * 3600 + mi * 60 + s;
};
MSP.utils.formatDate = function (ts) {
  try {
    var d = new Date(ts);
    if (isNaN(d.getTime())) { return 'Unknown'; }
    return d.getFullYear() + '-' + MSP.utils.pad2(d.getMonth() + 1) + '-' + MSP.utils.pad2(d.getDate()) +
      ' ' + MSP.utils.pad2(d.getHours()) + ':' + MSP.utils.pad2(d.getMinutes());
  } catch (e) { return 'Unknown'; }
};
/* FNV-1a 32-bit hash, hex output. Used ONLY for the app-lock PIN.
   The raw PIN is never stored. This is a local lock, not encryption. */
MSP.utils.hashPin = function (pin) {
  var h = 0x811c9dc5;
  var s = String(pin || '');
  var i, c;
  for (i = 0; i < s.length; i++) {
    c = s.charCodeAt(i);
    h ^= c;
    h = (h * 0x01000193) >>> 0;
  }
  var hex = h.toString(16);
  while (hex.length < 8) { hex = '0' + hex; }
  return 'fnv1a:' + hex;
};
MSP.utils.safeJSONParse = function (text, fallback) {
  try {
    var v = JSON.parse(text);
    return v === null || v === undefined ? fallback : v;
  } catch (e) { return fallback; }
};
/* Split a .mpa file: audio bytes + literal separator + video bytes.
   Returns { audio: ArrayBuffer|null, video: ArrayBuffer|null, found: boolean }.
   Pure function over bytes so it can be unit-tested in Node. */
MSP.utils.splitMpa = function (buffer) {
  var sep = '[shifat100]';
  var bytes = new Uint8Array(buffer);
  var sepBytes = [];
  var i, j, found, idx = -1;
  for (i = 0; i < sep.length; i++) { sepBytes.push(sep.charCodeAt(i)); }
  for (i = 0; i <= bytes.length - sepBytes.length; i++) {
    found = true;
    for (j = 0; j < sepBytes.length; j++) {
      if (bytes[i + j] !== sepBytes[j]) { found = false; break; }
    }
    if (found) { idx = i; break; }
  }
  if (idx === -1) { return { audio: null, video: null, found: false }; }
  return {
    audio: buffer.slice(0, idx),
    video: buffer.slice(idx + sepBytes.length),
    found: true
  };
};
MSP.utils.makeEl = function (tag, cls) {
  var el = document.createElement(tag);
  if (cls) { el.className = cls; }
  return el;
};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MSP.utils;
}
