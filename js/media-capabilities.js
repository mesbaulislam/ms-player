/* MS Player - media-capabilities.js.
   Honest capability detection for the KaiOS 2.5 / Gecko 48 runtime.
   Embedded MKV audio/subtitle track switching is NOT available here:
   HTMLMediaElement.audioTracks / videoTracks / textTracks track lists are
   not exposed for embedded MKV tracks on this engine, so we never fake it. */
var MSP = window.MSP || {};
window.MSP = MSP;
MSP.caps = {};
MSP.caps.detect = function () {
  var v = null;
  try { v = document.createElement('video'); } catch (e) { v = null; }
  var caps = {
    hasVideoElement: !!v,
    /* True only if the engine actually exposes a usable audioTracks list. */
    hasAudioTracks: false,
    hasTextTracks: false,
    hasVolumeManager: !!(window.navigator && window.navigator.volumeManager &&
      window.navigator.volumeManager.requestUp && window.navigator.volumeManager.requestDown),
    hasDeviceStorage: !!(window.navigator && (window.navigator.getDeviceStorages || window.navigator.getDeviceStorage)),
    hasMozActivity: !!(window.navigator && window.navigator.mozSetMessageHandler),
    hasCanvas: false,
    hasPlaybackRate: false,
    embeddedAudioSwitching: false,
    embeddedSubtitleSwitching: false,
    embeddedAssRendering: false
  };
  if (v) {
    try { caps.hasAudioTracks = !!(v.audioTracks && typeof v.audioTracks.length === 'number' && v.audioTracks.length > 0); } catch (e) { caps.hasAudioTracks = false; }
    try { caps.hasTextTracks = !!(v.textTracks && typeof v.textTracks.length === 'number'); } catch (e) { caps.hasTextTracks = false; }
    try { caps.hasPlaybackRate = ('playbackRate' in v); } catch (e) { caps.hasPlaybackRate = false; }
  }
  try { caps.hasCanvas = !!document.createElement('canvas').getContext; } catch (e) { caps.hasCanvas = false; }
  /* Gecko 48 on KaiOS 2.5 does not expose embedded MKV track lists, so all
     three embedded capabilities stay false. They are only set true if a
     future runtime proves otherwise via real track objects. */
  caps.embeddedAudioSwitching = false;
  caps.embeddedSubtitleSwitching = false;
  caps.embeddedAssRendering = false;
  return caps;
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MSP.caps; }
