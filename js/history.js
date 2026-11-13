/* MS Player - history.js. Continue Watching + saved positions.
   Only name + path + position + timestamp are stored. Never video data.
   A saved path may stop working if the file is moved/renamed/deleted. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.history = {};
MSP.history.KEY = 'msplayer_history_v1';
MSP.history.load = function () {
  var raw = null;
  try { raw = window.localStorage.getItem(MSP.history.KEY); } catch (e) { return []; }
  var list = MSP.utils.safeJSONParse(raw, []);
  if (!list || !(list instanceof Array)) { return []; }
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var e = list[i];
    if (e && typeof e.name === 'string' && typeof e.path === 'string') {
      out.push({ name: e.name, path: e.path, position: Number(e.position) || 0, duration: Number(e.duration) || 0, updated: Number(e.updated) || 0 });
    }
  }
  return out;
};
MSP.history.save = function (list) {
  try { window.localStorage.setItem(MSP.history.KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
};
MSP.history.upsert = function (file, position, duration) {
  if (!file || !file.name) { return; }
  var list = MSP.history.load();
  var i, found = -1;
  for (i = 0; i < list.length; i++) { if (list[i].path === file.name) { found = i; break; } }
  var entry = {
    name: file.name,
    path: file.name,
    position: Math.max(0, Math.floor(Number(position) || 0)),
    duration: Math.max(0, Math.floor(Number(duration) || 0)),
    updated: new Date().getTime()
  };
  if (found >= 0) { list.splice(found, 1); }
  list.unshift(entry);
  if (list.length > 50) { list = list.slice(0, 50); }
  MSP.history.save(list);
};
MSP.history.positionFor = function (path) {
  var list = MSP.history.load();
  var i;
  for (i = 0; i < list.length; i++) { if (list[i].path === path) { return list[i].position; } }
  return 0;
};
MSP.history.remove = function (path) {
  var list = MSP.history.load();
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) { if (list[i].path !== path) { out.push(list[i]); } }
  MSP.history.save(out);
};
MSP.history.clear = function () {
  try { window.localStorage.removeItem(MSP.history.KEY); } catch (e) { /* ignore */ }
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.history; }
