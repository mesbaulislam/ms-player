/* MS Player - file-handler.js. Handles both launch paths:
   1) Icon launch -> normal app start (Home screen).
   2) File Manager Share / Open With -> system activity.
      - "view"/"open" activities deliver data.blob (a single File/Blob).
      - "share" activities deliver data.blobs (an array); we play blobs[0].
      - data.file is accepted as a fallback.
   The received Blob is passed to the player; we never pretend playback
   succeeded when no file arrived. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.fileHandler = {};
MSP.fileHandler.pendingBlob = null;
MSP.fileHandler.activityReceived = false;
MSP.fileHandler.register = function () {
  var nav = window.navigator;
  if (!nav || !nav.mozSetMessageHandler) { return; }
  try {
    nav.mozSetMessageHandler('activity', function (req) {
      var data = null;
      try { data = req && req.source ? req.source.data : null; } catch (e) { data = null; }
      var blob = MSP.fileHandler.extractBlob(data);
      MSP.fileHandler.activityReceived = true;
      if (!blob) {
        MSP.nav.showError('No file was received from File Manager. Open MS Player from its icon and pick a video from the list instead.');
        return;
      }
      MSP.fileHandler.pendingBlob = blob;
      MSP.nav.handleActivityBlob(blob);
    });
  } catch (e) { /* activities unavailable: icon launch still works */ }
};
MSP.fileHandler.extractBlob = function (data) {
  if (!data) { return null; }
  if (data.blob) { return data.blob; }
  if (data.blobs && data.blobs.length > 0) { return data.blobs[0]; }
  if (data.file) { return data.file; }
  return null;
};
MSP.fileHandler.blobToFileInfo = function (blob) {
  return {
    name: blob.name || 'shared-video',
    size: blob.size || 0,
    type: blob.type || '',
    lastModified: blob.lastModified || 0,
    blob: blob
  };
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.fileHandler; }
