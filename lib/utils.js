const chalk = require("chalk");

module.exports = {
  error: function error(message) {
    console.log(chalk.red(`[RELOADER:ERROR] ${message}`));
  },

  hint: function hint(message) {
    console.log(chalk.green(` [RELOADER:HINT] ${message}`));
  },

  info: function info(message) {
    console.log(chalk.blue(` [RELOADER:INFO] ${message}`));
  },

  collect: function collect(value, buffer) {
    buffer.push(value);
    return buffer;
  }
};
