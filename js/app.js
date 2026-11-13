/* MS Player - app.js. Startup: settings load, activity registration,
   lock gate, Home screen. No network, no tracking, no ads. */
(function () {
  function start() {
    MSP.settings.current = MSP.settings.load();
    MSP.fileHandler.register();
    MSP.nav.init();
    var s = MSP.settings.current;
    if (s.lock && s.pinHash) {
      MSP.nav.showScreen('lock');
    } else {
      MSP.nav.showScreen('home');
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
