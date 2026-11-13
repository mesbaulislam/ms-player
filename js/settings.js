/* MS Player - settings.js. Persistent settings in localStorage.
   Corrupted stored settings fall back to defaults. Destructive actions
   always ask for confirmation (see navigation dialogs). */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.settings = {};
MSP.settings.KEY = 'msplayer_settings_v1';
MSP.settings.defaults = function () {
  return {
    extensions: 'mp4,3gp,mkv,mpa,3gpp',
    bgPlay: false,
    autoScale: false,
    lock: false,
    pinHash: ''
  };
};
MSP.settings.load = function () {
  var d = MSP.settings.defaults();
  var raw = null;
  try { raw = window.localStorage.getItem(MSP.settings.KEY); } catch (e) { return d; }
  if (!raw) { return d; }
  var parsed = MSP.utils.safeJSONParse(raw, null);
  if (!parsed || typeof parsed !== 'object') { return d; }
  var out = MSP.settings.defaults();
  if (typeof parsed.extensions === 'string' && parsed.extensions.replace(/[\s,]/g, '') !== '') {
    out.extensions = parsed.extensions;
  }
  out.bgPlay = parsed.bgPlay === true;
  out.autoScale = parsed.autoScale === true;
  out.lock = parsed.lock === true;
  if (typeof parsed.pinHash === 'string') { out.pinHash = parsed.pinHash; }
  return out;
};
MSP.settings.save = function (s) {
  try { window.localStorage.setItem(MSP.settings.KEY, JSON.stringify(s)); } catch (e) { /* storage full/blocked: keep in-memory copy */ }
  MSP.settings.current = s;
};
MSP.settings.extensionList = function () {
  var s = MSP.settings.current || MSP.settings.defaults();
  var parts = String(s.extensions || '').split(',');
  var out = [];
  var i, p;
  for (i = 0; i < parts.length; i++) {
    p = parts[i].replace(/^\s+|\s+$/g, '').toLowerCase().replace(/^\./, '');
    if (p && out.indexOf(p) === -1) { out.push(p); }
  }
  if (out.length === 0) { out = ['mp4', '3gp', 'mkv', 'mpa', '3gpp']; }
  return out;
};
MSP.settings.resetAll = function () {
  /* Clears settings + history + hidden index + saved positions. */
  try {
    var keys = [];
    var i;
    for (i = 0; i < window.localStorage.length; i++) { keys.push(window.localStorage.key(i)); }
    for (i = 0; i < keys.length; i++) {
      if (keys[i] && keys[i].indexOf('msplayer_') === 0) { window.localStorage.removeItem(keys[i]); }
    }
  } catch (e) { /* ignore */ }
  MSP.settings.current = MSP.settings.defaults();
  MSP.settings.save(MSP.settings.current);
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.settings; }
