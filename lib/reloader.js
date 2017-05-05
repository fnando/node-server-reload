const cluster = require("cluster");
const path = require("path");
const utils = require("./utils");
const Watcher = require("./watcher");

class Reloader {
  constructor(options) {
    this.options = options;
  }

  run() {
    if (cluster.isMaster) {
      utils.info(`Master process pid=${process.pid} is running`);

      let fork;

      cluster.on("exit", (worker, code, signal) => {
        const reason = code ? `exit=${code}` : `signal=${signal}`;
        const func = code && code > 0 ? utils.error : utils.info;
        func(`Server fork pid=${worker.process.pid} died (${reason})`);
      });

      const watcher = new Watcher(this.options);
      watcher.init();

      setInterval(()=> {
        if (!fork || (fork && !fork.process.connected)) {
          utils.info(`Forking new server process`);
          fork = cluster.fork();
        }
      }, 500);

      watcher.on("change", ()=> {
        if (fork && fork.process.connected) {
          utils.info(`Killing server fork pid=${fork.process.pid}`);
          fork.kill();
        }
      })
    } else {
      require(this.options.entryFile);
      utils.info(`Server fork pid=${process.pid} started`);
    }
  }
}

module.exports = function reloader(options) {
  new Reloader(options).run();
};
