/* MS Player - navigation.js. Screen router + THE single global key handler.
   One keydown listener and one keyup listener for the whole app: no duplicate
   handlers, no per-screen listeners. Long-press detection (>=1000 ms) lives
   here and is only active on the player screen with no dialog open. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.nav = {};
MSP.nav.screen = 'home';
MSP.nav.dialog = null;
MSP.nav.returnScreen = 'home';
MSP.nav.selectedFile = null; /* File / file-like object for the options menu */
MSP.nav.selectedSource = 'library';
MSP.nav.selectedHiddenEntry = null;
MSP.nav.digitBuffer = '';
MSP.nav.digitTimer = null;
MSP.nav.pressStart = {};
MSP.nav.pressInPlayer = {};
MSP.nav.LONG_MS = 1000;
MSP.nav.LONG_KEYS = ['1', '3', '4', '5', '6', '9'];

MSP.nav.$ = MSP.utils.$;
MSP.nav.screens = ['home', 'library', 'search', 'continue', 'hidden', 'settings', 'help', 'player', 'lock', 'empty'];
MSP.nav.dialogs = ['options', 'player-options', 'jump', 'details', 'unsupported', 'reset', 'clear-history', 'missing', 'error', 'loading'];

MSP.nav.setSoftkeys = function (l, c, r) {
  MSP.utils.setText(MSP.nav.$('softLeft'), l || '');
  MSP.utils.setText(MSP.nav.$('softCenter'), c || '');
  MSP.utils.setText(MSP.nav.$('softRight'), r || '');
};
MSP.nav.titles = {
  home: 'MS Player', library: 'Videos', search: 'Search', continue: 'Continue Watching',
  hidden: 'Hidden Files', settings: 'Settings', help: 'Help / Shortcuts',
  player: 'Now Playing', lock: 'MS Player', empty: 'No Videos'
};
MSP.nav.showScreen = function (name) {
  MSP.nav.screen = name;
  MSP.nav.dialog = null;
  var i;
  for (i = 0; i < MSP.nav.screens.length; i++) {
    var el = MSP.nav.$('screen-' + MSP.nav.screens[i]);
    if (el) { MSP.utils.addClass(el, 'hidden'); }
  }
  for (i = 0; i < MSP.nav.dialogs.length; i++) {
    var d = MSP.nav.$('dlg-' + MSP.nav.dialogs[i]);
    if (d) { MSP.utils.addClass(d, 'hidden'); }
  }
  var target = MSP.nav.$('screen-' + name);
  if (target) { MSP.utils.removeClass(target, 'hidden'); }
  MSP.utils.setText(MSP.nav.$('headerTitle'), MSP.nav.titles[name] || 'MS Player');
  MSP.nav.applySoftkeys();
  MSP.nav.focusFirst();
};
MSP.nav.applySoftkeys = function () {
  var s = MSP.nav.screen;
  if (s === 'home') { MSP.nav.setSoftkeys('Open', 'Select', 'Exit'); }
  else if (s === 'library') { MSP.nav.setSoftkeys('Search', 'Options', 'Back'); }
  else if (s === 'search') { MSP.nav.setSoftkeys('Back', 'Select', 'Back'); }
  else if (s === 'continue') { MSP.nav.setSoftkeys('Clear', 'Options', 'Back'); }
  else if (s === 'hidden') { MSP.nav.setSoftkeys('Unhide', 'Options', 'Back'); }
  else if (s === 'settings') { MSP.nav.setSoftkeys('Save', 'Select', 'Back'); }
  else if (s === 'help') { MSP.nav.setSoftkeys('', 'Select', 'Back'); }
  else if (s === 'player') { MSP.nav.setSoftkeys('Fullscreen', 'Pause', 'Restore'); }
  else if (s === 'lock') { MSP.nav.setSoftkeys('Unlock', 'Unlock', 'Close'); }
  else if (s === 'empty') { MSP.nav.setSoftkeys('Rescan', 'Select', 'Back'); }
};
MSP.nav.openDialog = function (name, returnScreen) {
  MSP.nav.dialog = name;
  MSP.nav.returnScreen = returnScreen || MSP.nav.screen;
  var d = MSP.nav.$('dlg-' + name);
  if (d) { MSP.utils.removeClass(d, 'hidden'); }
  if (name === 'options') { MSP.nav.setSoftkeys('', 'Select', 'Close'); }
  else if (name === 'player-options') { MSP.nav.setSoftkeys('', 'Select', 'Close'); }
  else if (name === 'jump') { MSP.nav.setSoftkeys('Jump', 'Jump', 'Cancel'); }
  else if (name === 'details') { MSP.nav.setSoftkeys('', '', 'Close'); }
  else if (name === 'unsupported') { MSP.nav.setSoftkeys('', 'Close', 'Close'); }
  else if (name === 'reset') { MSP.nav.setSoftkeys('Reset', '', 'Cancel'); }
  else if (name === 'clear-history') { MSP.nav.setSoftkeys('Clear', '', 'Cancel'); }
  else if (name === 'missing') { MSP.nav.setSoftkeys('', 'Back', 'Back'); }
  else if (name === 'error') { MSP.nav.setSoftkeys('', 'Back', 'Back'); }
  else if (name === 'loading') { MSP.nav.setSoftkeys('', '', ''); }
  MSP.nav.focusFirst();
  /* A dialog over the player keeps the player overlays visible so the
     user always sees what is happening behind the dialog. */
  if (MSP.nav.screen === 'player') { MSP.player.showOverlays(); }
};
MSP.nav.closeDialog = function () {
  if (!MSP.nav.dialog) { return; }
  var d = MSP.nav.$('dlg-' + MSP.nav.dialog);
  if (d) { MSP.utils.addClass(d, 'hidden'); }
  MSP.nav.dialog = null;
  if (MSP.nav.screen === 'player') {
    MSP.nav.setSoftkeys(MSP.player.fullscreen ? 'Exit Full' : 'Fullscreen',
      (MSP.player.video() && MSP.player.video().paused) ? 'Play' : 'Pause', 'Restore');
    MSP.player.showOverlays();
  } else {
    MSP.nav.applySoftkeys();
  }
  MSP.nav.focusFirst();
};
MSP.nav.showLoading = function (msg) {
  MSP.utils.setText(MSP.nav.$('loadingBody'), msg || 'Please wait.');
  MSP.nav.openDialog('loading');
};
MSP.nav.hideLoading = function () {
  if (MSP.nav.dialog === 'loading') { MSP.nav.closeDialog(); }
};
MSP.nav.showError = function (msg) {
  MSP.nav.hideLoading();
  MSP.utils.setText(MSP.nav.$('errorBody'), msg);
  MSP.nav.openDialog('error', MSP.nav.screen === 'player' ? 'library' : MSP.nav.screen);
};
MSP.nav.showMissing = function (msg) {
  MSP.utils.setText(MSP.nav.$('missingBody'), msg);
  MSP.nav.openDialog('missing');
};
MSP.nav.showUnsupported = function (msg) {
  MSP.utils.setText(MSP.nav.$('unsupportedBody'), msg);
  MSP.nav.openDialog('unsupported');
};
/* ---- focus helpers ---- */
MSP.nav.focusablesIn = function (root) {
  if (!root) { return []; }
  var nodes = root.querySelectorAll('li.menu-item, li.file-item, input, button');
  var out = [];
  var i;
  for (i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if (MSP.utils.hasClass(n, 'hidden')) { continue; }
    if (n.tagName === 'INPUT' && n.disabled) { continue; }
    out.push(n);
  }
  return out;
};
MSP.nav.currentFocusRoot = function () {
  if (MSP.nav.dialog) { return MSP.nav.$('dlg-' + MSP.nav.dialog); }
  return MSP.nav.$('screen-' + MSP.nav.screen);
};
MSP.nav.focusFirst = function () {
  var items = MSP.nav.focusablesIn(MSP.nav.currentFocusRoot());
  if (items.length) {
    try { items[0].focus(); } catch (e) { /* ignore */ }
    /* The focused item must always be visible on screen, even inside a
       dialog or an overlaid skin. */
    try { items[0].scrollIntoView(false); } catch (e2) { /* ignore */ }
  }
};
MSP.nav.moveFocus = function (delta) {
  var items = MSP.nav.focusablesIn(MSP.nav.currentFocusRoot());
  if (!items.length) { return; }
  var active = document.activeElement;
  var idx = -1;
  var i;
  for (i = 0; i < items.length; i++) { if (items[i] === active) { idx = i; break; } }
  var next = idx + delta;
  if (next < 0) { next = items.length - 1; }
  if (next >= items.length) { next = 0; }
  try { items[next].focus(); } catch (e) { /* ignore */ }
  try { items[next].scrollIntoView(false); } catch (e2) { /* ignore */ }
};
/* ---- scrolling for content screens / long dialog bodies ----
   Help has no focusable items and Details/Unsupported/Missing/Error
   dialogs have no menu items, so ArrowUp/Down must SCROLL their content
   instead of moving focus (focus-based navigation alone scrolls nothing). */
MSP.nav.scrollEl = function (el, delta) {
  if (!el) { return; }
  try { el.scrollTop = el.scrollTop + delta; } catch (e) { /* ignore */ }
};
MSP.nav.scrollDialogBody = function (bodyId, delta) {
  var body = MSP.nav.$(bodyId);
  if (!body) { return; }
  /* The body itself is scrollable (see dialogs.css). Fall back to the
     surrounding .dialog-box if the body has no overflow. */
  if (body.scrollHeight > body.clientHeight) { MSP.nav.scrollEl(body, delta); return; }
  var box = body.parentNode;
  if (box) { MSP.nav.scrollEl(box, delta); }
};
MSP.nav.scrollForKey = function (key) {
  var delta = (key === 'ArrowUp') ? -40 : 40;
  if (MSP.nav.dialog === 'details') { MSP.nav.scrollDialogBody('detailsBody', delta); return true; }
  if (MSP.nav.dialog === 'unsupported') { MSP.nav.scrollDialogBody('unsupportedBody', delta); return true; }
  if (MSP.nav.dialog === 'missing') { MSP.nav.scrollDialogBody('missingBody', delta); return true; }
  if (MSP.nav.dialog === 'error') { MSP.nav.scrollDialogBody('errorBody', delta); return true; }
  if (!MSP.nav.dialog && MSP.nav.screen === 'help') {
    MSP.nav.scrollEl(MSP.nav.$('screen-help'), delta);
    return true;
  }
  return false;
};
/* ---- Settings field-to-field navigation ----
   The Settings screen mixes text inputs, checkboxes and a button. When
   focus is inside a text input, Up/Down must move to the previous/next
   CONTROL (never trap focus in the input); Left/Right keep the default
   text-cursor movement inside the input. The disabled PIN field is skipped
   when app lock is off. */
MSP.nav.settingsOrder = ['setExtensions', 'setBgPlay', 'setAutoScale', 'setLock', 'setPin', 'btnResetSettings'];
MSP.nav.moveSettingsFocus = function (delta) {
  var order = MSP.nav.settingsOrder;
  var active = document.activeElement;
  var idx = -1;
  var i;
  for (i = 0; i < order.length; i++) { if (active && active.id === order[i]) { idx = i; break; } }
  var next = idx + delta;
  var guard = 0;
  while (guard < order.length + 1) {
    if (next < 0) { next = order.length - 1; }
    if (next >= order.length) { next = 0; }
    var el = MSP.nav.$(order[next]);
    if (el && !el.disabled) {
      try { el.focus(); } catch (e) { /* ignore */ }
      try { el.scrollIntoView(false); } catch (e2) { /* ignore */ }
      return;
    }
    next += delta;
    guard++;
  }
};
MSP.nav.focusedFileItem = function () {
  var active = document.activeElement;
  if (!active || !MSP.utils.hasClass(active, 'file-item')) { return -1; }
  var idx = parseInt(active.getAttribute('data-index'), 10);
  return isNaN(idx) ? -1 : idx;
};
MSP.nav.isTyping = function () {
  var a = document.activeElement;
  return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
};
/* ---- list rendering ---- */
MSP.nav.refreshLibrary = function () {
  var list = MSP.library.files;
  MSP.library.renderList(MSP.nav.$('libraryList'), list, { withPosition: true });
  MSP.utils.setText(MSP.nav.$('libraryCount'), list.length + ' video(s)');
  if (list.length === 0) { MSP.utils.removeClass(MSP.nav.$('libraryEmpty'), 'hidden'); }
  else { MSP.utils.addClass(MSP.nav.$('libraryEmpty'), 'hidden'); }
  MSP.utils.addClass(MSP.nav.$('libraryError'), 'hidden');
};
MSP.nav.rescan = function () {
  MSP.nav.showLoading('Scanning for videos...');
  MSP.library.scan(function (files) {
    MSP.nav.hideLoading();
    MSP.nav.refreshLibrary();
    if (MSP.nav.screen === 'library' && files.length === 0) { MSP.nav.showScreen('empty'); }
  });
};
MSP.nav.refreshContinue = function () {
  var hist = MSP.history.load();
  var ul = MSP.nav.$('continueList');
  while (ul.firstChild) { ul.removeChild(ul.firstChild); }
  var i, e, li, nameEl, metaEl;
  for (i = 0; i < hist.length; i++) {
    e = hist[i];
    li = MSP.utils.makeEl('li', 'file-item');
    li.setAttribute('tabindex', '0');
    li.setAttribute('data-index', String(i));
    nameEl = MSP.utils.makeEl('div', 'file-name');
    MSP.utils.setText(nameEl, (i + 1) + '. ' + MSP.utils.displayName(e.name));
    metaEl = MSP.utils.makeEl('div', 'file-meta');
    MSP.utils.setText(metaEl, 'Resume ' + MSP.utils.formatTime(e.position) +
      (e.duration ? ' / ' + MSP.utils.formatTime(e.duration) : ''));
    li.appendChild(nameEl);
    li.appendChild(metaEl);
    ul.appendChild(li);
  }
  if (hist.length === 0) { MSP.utils.removeClass(MSP.nav.$('continueEmpty'), 'hidden'); }
  else { MSP.utils.addClass(MSP.nav.$('continueEmpty'), 'hidden'); }
};
MSP.nav.refreshHidden = function () {
  var idx = MSP.library.hiddenIndex();
  var ul = MSP.nav.$('hiddenList');
  while (ul.firstChild) { ul.removeChild(ul.firstChild); }
  var i, e, li, nameEl, metaEl;
  for (i = 0; i < idx.length; i++) {
    e = idx[i];
    li = MSP.utils.makeEl('li', 'file-item');
    li.setAttribute('tabindex', '0');
    li.setAttribute('data-index', String(i));
    nameEl = MSP.utils.makeEl('div', 'file-name');
    MSP.utils.setText(nameEl, (i + 1) + '. ' + MSP.utils.displayName(e.name));
    metaEl = MSP.utils.makeEl('div', 'file-meta');
    MSP.utils.setText(metaEl, MSP.utils.formatSize(e.size) + '  |  Hidden');
    li.appendChild(nameEl);
    li.appendChild(metaEl);
    ul.appendChild(li);
  }
  if (idx.length === 0) { MSP.utils.removeClass(MSP.nav.$('hiddenEmpty'), 'hidden'); }
  else { MSP.utils.addClass(MSP.nav.$('hiddenEmpty'), 'hidden'); }
};
MSP.nav.refreshSearch = function () {
  var q = MSP.nav.$('searchInput').value || '';
  var files = MSP.library.filtered(q);
  MSP.library.renderList(MSP.nav.$('searchList'), files, { withPosition: true });
  if (files.length === 0) { MSP.utils.removeClass(MSP.nav.$('searchEmpty'), 'hidden'); }
  else { MSP.utils.addClass(MSP.nav.$('searchEmpty'), 'hidden'); }
};
/* ---- open flows ---- */
MSP.nav.fileInfoFromFile = function (f) {
  return { name: f.name, size: f.size || 0, type: f.type || '', lastModified: f.lastModified || 0, blob: f };
};
MSP.nav.playFile = function (file, resume) {
  MSP.player.openFile(MSP.nav.fileInfoFromFile(file), { resume: !!resume });
};
MSP.nav.playHistoryEntry = function (entry, resume) {
  var self = this;
  MSP.nav.showLoading('Opening video...');
  MSP.library.getByPath(entry.path, function (f) {
    MSP.nav.hideLoading();
    if (!f) {
      MSP.history.remove(entry.path);
      MSP.nav.showMissing('This file is no longer available at the saved location. It may have been moved, renamed or deleted. The history entry was removed.');
      MSP.nav.refreshContinue();
      return;
    }
    MSP.player.openFile(MSP.nav.fileInfoFromFile(f), { resume: !!resume });
  });
};
MSP.nav.openOptionsForFile = function (file, source) {
  MSP.nav.selectedFile = file;
  MSP.nav.selectedHiddenEntry = null;
  MSP.nav.selectedSource = source || 'library';
  MSP.utils.setText(MSP.nav.$('optionsTitle'), MSP.utils.displayName(file.name));
  MSP.nav.openDialog('options');
};
MSP.nav.openOptionsForHidden = function (entry) {
  MSP.nav.selectedFile = null;
  MSP.nav.selectedHiddenEntry = entry;
  MSP.nav.selectedSource = 'hidden';
  MSP.utils.setText(MSP.nav.$('optionsTitle'), MSP.utils.displayName(entry.name));
  MSP.nav.openDialog('options');
};
MSP.nav.handleActivityBlob = function (blob) {
  var info = MSP.fileHandler.blobToFileInfo(blob);
  var settings = MSP.settings.current || MSP.settings.load();
  if (settings.lock && settings.pinHash) {
    MSP.fileHandler.pendingBlob = blob;
    MSP.nav.showScreen('lock');
    return;
  }
  MSP.player.openFile({ name: info.name, size: info.size, type: info.type, lastModified: info.lastModified, blob: blob }, { resume: true });
};
MSP.nav.backFromPlayer = function () {
  MSP.player.cleanup();
  MSP.nav.showScreen('library');
  MSP.nav.refreshLibrary();
};
MSP.nav.fillSettings = function () {
  var s = MSP.settings.current || MSP.settings.load();
  MSP.nav.$('setExtensions').value = s.extensions;
  MSP.nav.$('setBgPlay').checked = s.bgPlay;
  MSP.nav.$('setAutoScale').checked = s.autoScale;
  MSP.nav.$('setLock').checked = s.lock;
  MSP.nav.$('setPin').value = '';
  MSP.nav.$('setPin').disabled = !s.lock;
};
MSP.nav.saveSettings = function () {
  var s = MSP.settings.current || MSP.settings.defaults();
  var lockOn = MSP.nav.$('setLock').checked;
  var pin = MSP.nav.$('setPin').value || '';
  var next = {
    extensions: MSP.nav.$('setExtensions').value || s.extensions,
    bgPlay: MSP.nav.$('setBgPlay').checked,
    autoScale: MSP.nav.$('setAutoScale').checked,
    lock: lockOn,
    pinHash: s.pinHash
  };
  if (lockOn) {
    if (pin) {
      if (pin.length < 4) { MSP.player.toast('PIN must be at least 4 characters.'); return false; }
      next.pinHash = MSP.utils.hashPin(pin);
    } else if (!next.pinHash) {
      MSP.player.toast('Set a PIN to enable app lock.');
      return false;
    }
  } else {
    next.pinHash = '';
  }
  MSP.settings.save(next);
  MSP.settings.current = next;
  MSP.player.toast('Settings saved');
  return true;
};
MSP.nav.fillDetails = function (d) {
  var body = MSP.nav.$('detailsBody');
  while (body.firstChild) { body.removeChild(body.firstChild); }
  /* Display-decode Filename + Path (%20 / %5B / %5D -> readable text).
     The stored/internal path is never altered. */
  var rows = [
    ['Filename', MSP.utils.displayPath(d.filename)], ['Path', MSP.utils.displayPath(d.path)],
    ['Size', d.size], ['Type', d.type],
    ['Resolution', d.resolution], ['Duration', d.duration], ['Modified', d.lastModified],
    ['Audio', d.audio], ['Subtitles', d.subtitles]
  ];
  var i, row, k, v;
  for (i = 0; i < rows.length; i++) {
    row = MSP.utils.makeEl('div', 'row');
    k = MSP.utils.makeEl('span', 'k');
    MSP.utils.setText(k, rows[i][0] + ': ');
    v = MSP.utils.makeEl('span', 'v');
    MSP.utils.setText(v, rows[i][1]);
    row.appendChild(k);
    row.appendChild(v);
    body.appendChild(row);
  }
};
MSP.nav.showDetailsForFile = function (file) {
  MSP.nav.fillDetails({
    filename: MSP.utils.displayName(file.name),
    path: file.name,
    size: MSP.utils.formatSize(file.size),
    type: file.type || MSP.utils.extOf(file.name) || 'Unknown',
    resolution: 'Unknown (available while playing)',
    duration: 'Unknown (available while playing)',
    lastModified: file.lastModified ? MSP.utils.formatDate(file.lastModified) : 'Unknown',
    audio: 'Embedded track info requires playback; switching is not supported on this device',
    subtitles: 'External .vtt / .srt beside the file loads automatically (no option)'
  });
  MSP.nav.openDialog('details');
};
MSP.nav.fillHelp = function () {
  var body = MSP.nav.$('helpBody');
  var html = '<div class="help-sec"><b>Playback</b><br>' +
    '<span class="help-key">Enter</span> Play / Pause<br>' +
    '<span class="help-key">Left / Right</span> Seek -10s / +10s<br>' +
    '<span class="help-key">Up / Down</span> Volume up / down<br>' +
    '<span class="help-key">0</span> Player options<br>' +
    '<span class="help-key">7</span> Video list<br>' +
    '<span class="help-key">9</span> Jump to time (hold: restart)<br>' +
    '<span class="help-key">*</span> Zoom out &nbsp; <span class="help-key">#</span> Zoom in<br>' +
    '<span class="help-key">1 / 3</span> Rotate (hold: seek -200s / +200s)<br>' +
    '<span class="help-key">4 / 6</span> Speed -0.1 / +0.1 (hold: rotate)<br>' +
    '<span class="help-key">2</span> Speed reset to 1.0x<br>' +
    '<span class="help-key">5</span> Restore defaults (hold: repeat)<br>' +
    '<span class="help-key">Call / s</span> Screenshot<br>' +
    '<span class="help-key">LSK</span> Fullscreen &nbsp; <span class="help-key">RSK</span> Restore / Back</div>' +
    '<div class="help-sec"><b>Lists</b><br>Arrows move, Enter opens options, digits jump to the Nth file.</div>' +
    '<div class="help-sec"><b>Scrolling</b><br>Help: Up / Down scrolls this list. Video details: Up / Down scrolls the details. Settings: Up / Down moves between fields, Left / Right moves inside a text field.</div>' +
    '<div class="help-sec"><b>Limits</b><br>Embedded MKV audio/subtitle switching not supported. External .vtt / .srt subtitles beside the video file load automatically (no menu option).</div>';
  body.innerHTML = html;
};
/* ---- activation (Enter / Center) ---- */
MSP.nav.activate = function () {
  var d = MSP.nav.dialog;
  var active = document.activeElement;
  if (d === 'options') { MSP.nav.activateOptions(); return; }
  if (d === 'player-options') { MSP.nav.activatePlayerOptions(); return; }
  if (d === 'details' || d === 'unsupported' || d === 'missing' || d === 'error') { MSP.nav.closeDialog(); return; }
  if (d === 'reset') { return; }
  if (d === 'clear-history') { return; }
  if (d === 'jump') { MSP.nav.confirmJump(); return; }
  if (d === 'loading') { return; }
  var s = MSP.nav.screen;
  if (s === 'home') { MSP.nav.activateHome(); return; }
  if (s === 'library') { MSP.nav.activateLibraryItem(); return; }
  if (s === 'search') { MSP.nav.activateSearchItem(); return; }
  if (s === 'continue') { MSP.nav.activateContinueItem(); return; }
  if (s === 'hidden') { MSP.nav.activateHiddenItem(); return; }
  if (s === 'settings') {
    if (active && active.id === 'btnResetSettings') { MSP.nav.openDialog('reset'); return; }
    /* Checkboxes/inputs use native Enter behaviour (Enter fires click on a
       focused checkbox in Gecko). Do not toggle manually: that would
       double-toggle. The lock checkbox change listener syncs the PIN field. */
    return;
  }
  if (s === 'player') { MSP.player.togglePlay(); return; }
  if (s === 'lock') { MSP.nav.tryUnlock(); return; }
  if (s === 'empty') { MSP.nav.rescan(); return; }
};
MSP.nav.activateHome = function () {
  var active = document.activeElement;
  var target = active ? active.getAttribute('data-home') : null;
  if (target === 'library') { MSP.nav.showScreen('library'); MSP.nav.refreshLibrary(); if (MSP.library.files.length === 0) { MSP.nav.rescan(); } }
  else if (target === 'continue') { MSP.nav.showScreen('continue'); MSP.nav.refreshContinue(); }
  else if (target === 'hidden') { MSP.nav.showScreen('hidden'); MSP.nav.refreshHidden(); }
  else if (target === 'settings') { MSP.nav.fillSettings(); MSP.nav.showScreen('settings'); }
  else if (target === 'help') { MSP.nav.fillHelp(); MSP.nav.showScreen('help'); }
};
MSP.nav.activateLibraryItem = function () {
  var idx = MSP.nav.focusedFileItem();
  if (idx < 0 || idx >= MSP.library.files.length) { return; }
  MSP.nav.openOptionsForFile(MSP.library.files[idx], 'library');
};
MSP.nav.activateSearchItem = function () {
  if (MSP.nav.isTyping() && document.activeElement.id === 'searchInput') {
    var files = MSP.library.filtered(MSP.nav.$('searchInput').value || '');
    if (files.length) { MSP.nav.openOptionsForFile(files[0], 'search'); }
    return;
  }
  var idx = MSP.nav.focusedFileItem();
  var files2 = MSP.library.filtered(MSP.nav.$('searchInput').value || '');
  if (idx < 0 || idx >= files2.length) { return; }
  MSP.nav.openOptionsForFile(files2[idx], 'search');
};
MSP.nav.activateContinueItem = function () {
  var idx = MSP.nav.focusedFileItem();
  var hist = MSP.history.load();
  if (idx < 0 || idx >= hist.length) { return; }
  MSP.nav.playHistoryEntry(hist[idx], true);
};
MSP.nav.activateHiddenItem = function () {
  var idx = MSP.nav.focusedFileItem();
  var list = MSP.library.hiddenIndex();
  if (idx < 0 || idx >= list.length) { return; }
  MSP.nav.openOptionsForHidden(list[idx]);
};
MSP.nav.activateOptions = function () {
  var active = document.activeElement;
  var action = active ? active.getAttribute('data-opt') : null;
  if (!action) { return; }
  if (action === 'play' || action === 'resume') {
    if (MSP.nav.selectedFile) {
      var f = MSP.nav.selectedFile;
      MSP.nav.closeDialog();
      MSP.nav.playFile(f, action === 'resume');
    } else if (MSP.nav.selectedHiddenEntry) {
      MSP.player.toast('Unhide the file first to play it.');
      MSP.nav.closeDialog();
    }
    return;
  }
  if (action === 'details') {
    if (MSP.nav.selectedFile) {
      var f2 = MSP.nav.selectedFile;
      MSP.nav.closeDialog();
      MSP.nav.showDetailsForFile(f2);
    }
    return;
  }
  if (action === 'hide') {
    if (!MSP.nav.selectedFile) { MSP.player.toast('Nothing to hide.'); MSP.nav.closeDialog(); return; }
    var fh = MSP.nav.selectedFile;
    MSP.nav.closeDialog();
    MSP.nav.showLoading('Hiding file...');
    MSP.library.hideFile(fh, function (ok, err) {
      MSP.nav.hideLoading();
      if (ok) { MSP.player.toast('File hidden'); MSP.nav.refreshLibrary(); }
      else { MSP.nav.showError(err || 'Hide failed.'); }
    });
    return;
  }
  if (action === 'unhide') {
    if (!MSP.nav.selectedHiddenEntry) { MSP.player.toast('Nothing to unhide.'); MSP.nav.closeDialog(); return; }
    var entry = MSP.nav.selectedHiddenEntry;
    MSP.nav.closeDialog();
    MSP.nav.showLoading('Unhiding file...');
    MSP.library.unhideFile(entry, function (ok, err) {
      MSP.nav.hideLoading();
      if (ok) { MSP.player.toast('File restored to downloads/'); MSP.nav.refreshHidden(); MSP.nav.rescan(); }
      else { MSP.nav.showError(err || 'Unhide failed.'); }
    });
    return;
  }
};
MSP.nav.activatePlayerOptions = function () {
  var active = document.activeElement;
  var action = active ? active.getAttribute('data-popt') : null;
  if (!action) { return; }
  MSP.nav.closeDialog();
  if (action === 'details') {
    var d = MSP.player.details();
    if (d) { MSP.nav.fillDetails(d); MSP.nav.openDialog('details'); }
  } else if (action === 'jump') { MSP.nav.openDialog('jump'); MSP.nav.$('jumpInput').value = '00:00:00'; }
  else if (action === 'screenshot') { MSP.player.screenshot(); }
  else if (action === 'mute') { MSP.player.toggleMute(); }
  else if (action === 'repeat') { MSP.player.toggleRepeat(); }
  else if (action === 'settings') { MSP.nav.fillSettings(); MSP.nav.showScreen('settings'); }
  else if (action === 'list') { MSP.nav.backFromPlayer(); }
};
MSP.nav.confirmJump = function () {
  var secs = MSP.utils.parseHMS(MSP.nav.$('jumpInput').value);
  if (secs < 0) { MSP.player.toast('Use HH:MM:SS format'); return; }
  if (MSP.player.jumpTo(secs)) {
    MSP.player.toast('Jumped to ' + MSP.utils.formatTime(secs));
    MSP.nav.closeDialog();
  } else {
    MSP.player.toast('Time is outside the video length');
  }
};
MSP.nav.tryUnlock = function () {
  var pin = MSP.nav.$('lockPin').value || '';
  var s = MSP.settings.current || MSP.settings.load();
  MSP.utils.addClass(MSP.nav.$('lockError'), 'hidden');
  if (MSP.utils.hashPin(pin) === s.pinHash) {
    MSP.nav.$('lockPin').value = '';
    var pending = MSP.fileHandler.pendingBlob;
    MSP.fileHandler.pendingBlob = null;
    if (pending) {
      var info = MSP.fileHandler.blobToFileInfo(pending);
      MSP.player.openFile({ name: info.name, size: info.size, type: info.type, lastModified: info.lastModified, blob: pending }, { resume: true });
    } else {
      MSP.nav.showScreen('home');
    }
  } else {
    MSP.utils.removeClass(MSP.nav.$('lockError'), 'hidden');
  }
};
/* ---- softkeys ---- */
MSP.nav.softLeft = function () {
  var d = MSP.nav.dialog;
  if (d === 'reset') {
    MSP.nav.closeDialog();
    MSP.settings.resetAll();
    MSP.settings.current = MSP.settings.defaults();
    MSP.nav.fillSettings();
    MSP.player.toast('Settings reset');
    return;
  }
  if (d === 'clear-history') {
    MSP.nav.closeDialog();
    MSP.history.clear();
    MSP.nav.refreshContinue();
    MSP.player.toast('History cleared');
    return;
  }
  if (d === 'jump') { MSP.nav.confirmJump(); return; }
  if (d) { return; }
  var s = MSP.nav.screen;
  if (s === 'home') { MSP.nav.activateHome(); }
  else if (s === 'library') { MSP.nav.showScreen('search'); MSP.nav.refreshSearch(); try { MSP.nav.$('searchInput').focus(); } catch (e) { /* ignore */ } }
  else if (s === 'search') { MSP.nav.showScreen('library'); MSP.nav.refreshLibrary(); }
  else if (s === 'continue') { MSP.nav.openDialog('clear-history'); }
  else if (s === 'hidden') { MSP.nav.activateHiddenItem(); }
  else if (s === 'settings') { if (MSP.nav.saveSettings()) { MSP.nav.showScreen('home'); } }
  else if (s === 'player') { MSP.player.toggleFullscreen(); }
  else if (s === 'lock') { MSP.nav.tryUnlock(); }
  else if (s === 'empty') { MSP.nav.rescan(); }
};
MSP.nav.softRight = function () {
  var d = MSP.nav.dialog;
  if (d === 'loading') { return; }
  if (d === 'reset' || d === 'clear-history' || d === 'jump') { MSP.nav.closeDialog(); return; }
  if (d === 'error' || d === 'missing') {
    var ret = MSP.nav.returnScreen;
    MSP.nav.closeDialog();
    if (ret && ret !== 'player') { MSP.nav.showScreen(ret); }
    else { MSP.nav.showScreen('library'); MSP.nav.refreshLibrary(); }
    return;
  }
  if (d) { MSP.nav.closeDialog(); return; }
  var s = MSP.nav.screen;
  if (s === 'home') { try { window.close(); } catch (e) { /* ignore */ } }
  else if (s === 'library' || s === 'continue' || s === 'hidden' || s === 'settings' || s === 'help' || s === 'empty') { MSP.nav.showScreen('home'); }
  else if (s === 'search') { MSP.nav.showScreen('library'); MSP.nav.refreshLibrary(); }
  else if (s === 'player') {
    if (MSP.player.fullscreen) { MSP.player.exitFullscreen(false); }
    else { MSP.nav.backFromPlayer(); }
  }
  else if (s === 'lock') { try { window.close(); } catch (e2) { /* ignore */ } }
};
/* ---- digit jump ---- */
MSP.nav.digitJump = function (digit) {
  var s = MSP.nav.screen;
  if (s !== 'library' && s !== 'search' && s !== 'continue' && s !== 'hidden') { return; }
  MSP.nav.digitBuffer += digit;
  if (MSP.nav.digitTimer) { clearTimeout(MSP.nav.digitTimer); }
  MSP.nav.digitTimer = setTimeout(function () {
    var n = parseInt(MSP.nav.digitBuffer, 10);
    MSP.nav.digitBuffer = '';
    if (isNaN(n) || n < 1) { return; }
    var root = MSP.nav.$('screen-' + MSP.nav.screen);
    var items = MSP.nav.focusablesIn(root);
    var fileItems = [];
    var i;
    for (i = 0; i < items.length; i++) { if (MSP.utils.hasClass(items[i], 'file-item')) { fileItems.push(items[i]); } }
    if (n <= fileItems.length) {
      try { fileItems[n - 1].focus(); } catch (e) { /* ignore */ }
      MSP.player.toast('Item ' + n);
    } else {
      MSP.player.toast('Only ' + fileItems.length + ' item(s)');
    }
  }, 900);
};
/* ---- key handling: the single global listeners ---- */
MSP.nav.onKeyDown = function (e) {
  var key = e.key || '';
  if (key === 'F1') { key = 'SoftLeft'; }
  if (key === 'F2') { key = 'SoftRight'; }
  if (MSP.nav.LONG_KEYS.indexOf(key) !== -1) {
    if (!e.repeat) {
      MSP.nav.pressStart[key] = new Date().getTime();
      MSP.nav.pressInPlayer[key] = (MSP.nav.screen === 'player' && !MSP.nav.dialog);
    }
    if (MSP.nav.pressInPlayer[key]) { if (e.preventDefault) { e.preventDefault(); } return; }
  }
  if (key === '2' && MSP.nav.screen === 'player' && !MSP.nav.dialog) {
    if (!e.repeat) { MSP.player.resetSpeed(); }
    return;
  }
  /* Any key on the player screen re-shows the auto-hidden overlays. */
  if (MSP.nav.screen === 'player') { MSP.player.showOverlays(); }
  if (MSP.nav.isTyping()) {
    /* SETTINGS: never trap focus inside a text input. Up/Down moves to the
       previous/next control; Left/Right keeps the text-cursor movement;
       Enter on a text input moves to the next field; Enter on a checkbox
       keeps the native toggle (do not preventDefault). */
    if (MSP.nav.screen === 'settings' && !MSP.nav.dialog) {
      if (key === 'ArrowUp') { if (e.preventDefault) { e.preventDefault(); } MSP.nav.moveSettingsFocus(-1); return; }
      if (key === 'ArrowDown') { if (e.preventDefault) { e.preventDefault(); } MSP.nav.moveSettingsFocus(1); return; }
      if (key === 'Enter') {
        var st = document.activeElement;
        if (st && (st.type === 'text' || st.type === 'password')) {
          if (e.preventDefault) { e.preventDefault(); }
          MSP.nav.moveSettingsFocus(1);
        }
        return;
      }
    }
    if (key === 'SoftLeft') { MSP.nav.softLeft(); if (e.preventDefault) { e.preventDefault(); } }
    else if (key === 'SoftRight' || key === 'Backspace') { /* let Backspace edit text; SoftRight goes back */ if (key === 'SoftRight') { MSP.nav.softRight(); } }
    else if (key === 'Enter') {
      if (MSP.nav.dialog === 'jump') { MSP.nav.confirmJump(); }
      else if (MSP.nav.screen === 'search') { MSP.nav.activateSearchItem(); }
      else if (MSP.nav.screen === 'lock') { MSP.nav.tryUnlock(); }
      else if (MSP.nav.dialog) { MSP.nav.activate(); }
    } else if (key === 'ArrowDown' && MSP.nav.screen === 'search') {
      var items = MSP.nav.focusablesIn(MSP.nav.$('screen-search'));
      if (items.length > 1) { try { items[1].focus(); } catch (e2) { /* ignore */ } }
    }
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      if (MSP.nav.screen === 'search') { MSP.nav.refreshSearch(); }
    }
    return;
  }
  switch (key) {
    case 'SoftLeft': MSP.nav.softLeft(); break;
    case 'SoftRight': MSP.nav.softRight(); break;
    case 'Backspace': MSP.nav.softRight(); break;
    case 'Enter': MSP.nav.activate(); break;
    case 'ArrowUp':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.volumeUp(); }
      else if (MSP.nav.scrollForKey('ArrowUp')) { /* Help / long dialog body scrolled */ }
      else if (MSP.nav.screen === 'settings' && !MSP.nav.dialog) { MSP.nav.moveSettingsFocus(-1); }
      else if (MSP.nav.screen === 'search' && document.activeElement && document.activeElement.id === 'searchInput') { /* stay */ }
      else { MSP.nav.moveFocus(-1); }
      break;
    case 'ArrowDown':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.volumeDown(); }
      else if (MSP.nav.scrollForKey('ArrowDown')) { /* Help / long dialog body scrolled */ }
      else if (MSP.nav.screen === 'settings' && !MSP.nav.dialog) { MSP.nav.moveSettingsFocus(1); }
      else { MSP.nav.moveFocus(1); }
      break;
    case 'ArrowLeft':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.seekBy(-10); }
      break;
    case 'ArrowRight':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.seekBy(10); }
      break;
    case '0':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.nav.openDialog('player-options'); }
      break;
    case '7':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.nav.backFromPlayer(); }
      break;
    /* '8' intentionally does nothing in the player: there is no subtitle
       option any more (external subtitles auto-load silently). In lists it
       still falls through to digit-jump below. */
    case '*':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.zoomOut(); }
      break;
    case '#': case '/':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.zoomIn(); }
      break;
    case 'Call': case 's':
      if (MSP.nav.screen === 'player' && !MSP.nav.dialog) { MSP.player.screenshot(); }
      break;
    default:
      if (/^[0-9]$/.test(key)) { MSP.nav.digitJump(key); }
      break;
  }
};
MSP.nav.onKeyUp = function (e) {
  var key = e.key || '';
  if (MSP.nav.LONG_KEYS.indexOf(key) === -1) { return; }
  if (!MSP.nav.pressInPlayer[key]) { return; }
  MSP.nav.pressInPlayer[key] = false;
  var start = MSP.nav.pressStart[key] || 0;
  var held = new Date().getTime() - start;
  var isLong = held >= MSP.nav.LONG_MS;
  if (MSP.nav.screen !== 'player' || MSP.nav.dialog) { return; }
  if (key === '1') { if (isLong) { MSP.player.seekBy(-200); } else { MSP.player.rotateBy(-10); } }
  else if (key === '3') { if (isLong) { MSP.player.seekBy(200); } else { MSP.player.rotateBy(10); } }
  else if (key === '4') { if (isLong) { MSP.player.rotateBy(-10); } else { MSP.player.setSpeed(-0.1); } }
  else if (key === '6') { if (isLong) { MSP.player.rotateBy(10); } else { MSP.player.setSpeed(0.1); } }
  else if (key === '5') { if (isLong) { MSP.player.toggleRepeat(); } else { MSP.player.restoreDefaults(); } }
  else if (key === '9') {
    if (isLong) { MSP.player.restart(); }
    else { MSP.nav.openDialog('jump'); MSP.nav.$('jumpInput').value = '00:00:00'; }
  }
};
MSP.nav.init = function () {
  document.addEventListener('keydown', MSP.nav.onKeyDown);
  document.addEventListener('keyup', MSP.nav.onKeyUp);
  document.addEventListener('visibilitychange', function () { MSP.player.onVisibilityChange(); });
  /* Search input re-filters on every keystroke. */
  var searchInput = MSP.nav.$('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', function () { MSP.nav.refreshSearch(); });
    searchInput.addEventListener('input', function () { MSP.nav.refreshSearch(); });
  }
  /* Settings lock checkbox enables/disables the PIN field. */
  var lockBox = MSP.nav.$('setLock');
  if (lockBox) {
    lockBox.addEventListener('change', function () { MSP.nav.$('setPin').disabled = !lockBox.checked; });
  }
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.nav; }
