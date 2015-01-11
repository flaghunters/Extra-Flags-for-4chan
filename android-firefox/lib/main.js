//page-mod for page detection
var pageMod = require("sdk/page-mod");
//console.log("startup");
var keepWorker;

pageMod.PageMod({
  include: [/.*boards.4chan.org\/int.*/, /.*boards.4chan.org\/sp.*/],
  contentScriptWhen: 'ready',
  contentScriptFile: ["./jquery-2.3.1.min.js", "./flaghunters-code.js"],
  onAttach: function(worker) {
    keepWorker = worker;
    worker.postMessage("ready2go_xyz_");
  },
  onMessage: function(contentScriptMessage) {
    keepWorker.postMessage(require('sdk/simple-prefs').prefs['region']);
  }
});
