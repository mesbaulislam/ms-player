/* MS Player - video-library.js. DeviceStorage scan + Hide/Unhide.
   Enumerated names are used VERBATIM for get()/delete(). Filenames are only
   decoded for display, never altered internally. Hidden files live in the
   "hdn-svid/" folder on the SD card; the index is kept in localStorage. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.library = {};
MSP.library.files = []; /* File objects from enumerate() */
MSP.library.scanning = false;
MSP.library.HIDDEN_DIR = 'hdn-svid/';
MSP.library.HIDDEN_KEY = 'msplayer_hidden_v1';

MSP.library.storages = function () {
  var nav = window.navigator;
  if (!nav) { return []; }
  try {
    if (nav.getDeviceStorages) {
      var s = nav.getDeviceStorages('sdcard');
      if (s && s.length) { return s; }
    }
    if (nav.getDeviceStorage) { return [nav.getDeviceStorage('sdcard')]; }
  } catch (e) { /* fall through */ }
  return [];
};
MSP.library.isHiddenPath = function (name) {
  return String(name || '').indexOf(MSP.library.HIDDEN_DIR) === 0 || String(name || '').indexOf('/' + MSP.library.HIDDEN_DIR) !== -1;
};
MSP.library.hiddenIndex = function () {
  var raw = null;
  try { raw = window.localStorage.getItem(MSP.library.HIDDEN_KEY); } catch (e) { return []; }
  var list = MSP.utils.safeJSONParse(raw, []);
  return (list instanceof Array) ? list : [];
};
MSP.library.saveHiddenIndex = function (list) {
  try { window.localStorage.setItem(MSP.library.HIDDEN_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
};
MSP.library.matchesExt = function (name) {
  var ext = MSP.utils.extOf(name);
  return MSP.settings.extensionList().indexOf(ext) !== -1;
};
MSP.library.scan = function (onDone) {
  if (MSP.library.scanning) { if (onDone) { onDone(MSP.library.files); } return; }
  MSP.library.scanning = true;
  MSP.library.files = [];
  var storages = MSP.library.storages();
  if (storages.length === 0) {
    MSP.library.scanning = false;
    if (onDone) { onDone([]); }
    return;
  }
  var pending = storages.length;
  var finishOne = function () {
    pending--;
    if (pending <= 0) {
      MSP.library.scanning = false;
      MSP.library.files.sort(function (a, b) {
        var an = MSP.utils.displayName(a.name).toLowerCase();
        var bn = MSP.utils.displayName(b.name).toLowerCase();
        return an < bn ? -1 : (an > bn ? 1 : 0);
      });
      if (onDone) { onDone(MSP.library.files); }
    }
  };
  var i;
  for (i = 0; i < storages.length; i++) {
    (function (sd) {
      var cursor = null;
      try { cursor = sd.enumerate(); } catch (e) { finishOne(); return; }
      if (!cursor) { finishOne(); return; }
      cursor.onsuccess = function () {
        if (this.result) {
          var f = this.result;
          if (f && f.name && MSP.library.matchesExt(f.name) && !MSP.library.isHiddenPath(f.name)) {
            MSP.library.files.push(f);
          }
          try { this.continue(); } catch (e2) { finishOne(); }
        } else {
          finishOne();
        }
      };
      cursor.onerror = function () { finishOne(); };
    })(storages[i]);
  }
};
/* Render a file list into a UL. Each LI gets a safe text name + meta. */
MSP.library.renderList = function (ul, files, opts) {
  opts = opts || {};
  while (ul.firstChild) { ul.removeChild(ul.firstChild); }
  var i, f, li, nameEl, metaEl, label;
  for (i = 0; i < files.length; i++) {
    f = files[i];
    li = MSP.utils.makeEl('li', 'file-item');
    li.setAttribute('tabindex', '0');
    li.setAttribute('data-index', String(i));
    nameEl = MSP.utils.makeEl('div', 'file-name');
    MSP.utils.setText(nameEl, (i + 1) + '. ' + MSP.utils.displayName(f.name));
    metaEl = MSP.utils.makeEl('div', 'file-meta');
    label = MSP.utils.formatSize(f.size) + '  |  ' + (f.type || MSP.utils.extOf(f.name) || 'video');
    if (opts.withPosition && f.name) {
      var pos = MSP.history.positionFor(f.name);
      if (pos > 0) { label += '  |  Resume ' + MSP.utils.formatTime(pos); }
    }
    MSP.utils.setText(metaEl, label);
    li.appendChild(nameEl);
    li.appendChild(metaEl);
    ul.appendChild(li);
  }
  return ul;
};
MSP.library.filtered = function (query) {
  var q = String(query || '').replace(/^\s+|\s+$/g, '').toLowerCase();
  if (!q) { return MSP.library.files.slice(0); }
  var out = [];
  var i;
  for (i = 0; i < MSP.library.files.length; i++) {
    if (MSP.utils.displayName(MSP.library.files[i].name).toLowerCase().indexOf(q) !== -1) { out.push(MSP.library.files[i]); }
  }
  return out;
};
MSP.library.getByPath = function (path, cb) {
  var storages = MSP.library.storages();
  if (storages.length === 0) { if (cb) { cb(null); } return; }
  var idx = 0;
  var tryNext = function () {
    if (idx >= storages.length) { if (cb) { cb(null); } return; }
    var sd = storages[idx++];
    var req = null;
    try { req = sd.get(path); } catch (e) { tryNext(); return; }
    if (!req) { tryNext(); return; }
    req.onsuccess = function () { if (cb) { cb(req.result || null); } };
    req.onerror = function () { tryNext(); };
  };
  tryNext();
};
/* Hide: copy the file into hdn-svid/, delete the original, record the index. */
MSP.library.hideFile = function (file, cb) {
  var storages = MSP.library.storages();
  if (!storages.length || !file) { if (cb) { cb(false, 'No storage available.'); } return; }
  var sd = storages[0];
  var base = MSP.utils.baseName(file.name);
  var target = MSP.library.HIDDEN_DIR + base;
  var addReq = null;
  try { addReq = sd.addNamed(file, target); } catch (e) { if (cb) { cb(false, 'Hide failed: ' + e.message); } return; }
  addReq.onsuccess = function () {
    var delReq = null;
    try { delReq = sd.delete(file.name); } catch (e2) { if (cb) { cb(false, 'Hidden copy saved but original could not be deleted.'); } return; }
    delReq.onsuccess = function () {
      var idx = MSP.library.hiddenIndex();
      idx.push({ name: target, original: file.name, size: file.size || 0, type: file.type || '' });
      MSP.library.saveHiddenIndex(idx);
      MSP.library.files = MSP.library.files.filter(function (f) { return f.name !== file.name; });
      if (cb) { cb(true, null); }
    };
    delReq.onerror = function () { if (cb) { cb(false, 'Hidden copy saved but original could not be deleted.'); } };
  };
  addReq.onerror = function () { if (cb) { cb(false, 'Could not create hidden copy.'); } };
};
/* Unhide: copy back to downloads/, delete the hidden copy, drop the index entry. */
MSP.library.unhideFile = function (entry, cb) {
  var storages = MSP.library.storages();
  if (!storages.length || !entry) { if (cb) { cb(false, 'No storage available.'); } return; }
  var sd = storages[0];
  var getReq = null;
  try { getReq = sd.get(entry.name); } catch (e) { if (cb) { cb(false, 'Hidden file not found.'); } return; }
  getReq.onsuccess = function () {
    var blob = getReq.result;
    if (!blob) { if (cb) { cb(false, 'Hidden file not found.'); } return; }
    var addReq = null;
    try { addReq = sd.addNamed(blob, 'downloads/' + MSP.utils.baseName(entry.name)); } catch (e2) { if (cb) { cb(false, 'Unhide failed.'); } return; }
    addReq.onsuccess = function () {
      var delReq = null;
      try { delReq = sd.delete(entry.name); } catch (e3) { /* keep index removal anyway */ }
      var done = function () {
        var idx = MSP.library.hiddenIndex();
        var out = [];
        var i;
        for (i = 0; i < idx.length; i++) { if (idx[i].name !== entry.name) { out.push(idx[i]); } }
        MSP.library.saveHiddenIndex(out);
        if (cb) { cb(true, null); }
      };
      if (delReq) { delReq.onsuccess = done; delReq.onerror = done; } else { done(); }
    };
    addReq.onerror = function () { if (cb) { cb(false, 'Could not restore file.'); } };
  };
  getReq.onerror = function () { if (cb) { cb(false, 'Hidden file not found.'); } };
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.library; }
