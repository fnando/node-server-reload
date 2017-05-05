const EventEmitter = require("events");
const utils = require("./utils");

module.exports = class Watcher extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
  }

  init() {
    const watchman = require("fb-watchman");

    this.client = new watchman.Client();
    this.subscription = {
      expression: ["anyof", ["match", "*"]],
      fields: ["name", "size", "mtime_ms", "exists", "type"]
    };

    process.chdir(this.options.rootDirectory);
    utils.info(`Changed current directory to ${process.cwd()}`);
    this._watchProject();
  }

  _watchProject() {
    this.client.command(["watch-project", process.cwd()], (error, response) => {
      if (error) {
        throw new Error(error);
      }

      utils.info(`Watching directory: ${this.options.rootDirectory}`);

      if (response.watch) {
        utils.info(`Subscribing to changes: ${response.watch}`);
        this._subscribe(response.watch);
      }
    });
  }

  _subscribe(watch) {
    this.client.command(["subscribe", watch, "server-reload", this.subscription], (error, response) => {
      if (error) {
        throw new Error(error);
      }

      utils.info(`Issued subscribe command: ${JSON.stringify(response)}`);
    });

    this.client.on("subscription", (response) => {
      let matched = this.options.patterns.find((pattern) => {
        let regex = new RegExp(pattern);

        return response.files.find((file) => {
          return file.name.match(regex);
        });
      });

      if (!response.is_fresh_instance && matched) {
        this.emit("change");
      }
    });
  }
}
