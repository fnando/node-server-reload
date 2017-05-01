const program = require("commander");
const fs = require("fs");
const path = require("path");
const reloader = require("./reloader");
const utils = require("./utils");
const cluster = require("cluster");

let rootDirectory, entryFile, patterns;

if (cluster.isMaster) {
  program
    .version("0.1.0")
    .description("Reload server files when they change.")
    .option("--pattern <required>", "The pattern that must be watched", utils.collect, [])
    .option("--entry <required>", "The application entry point")
    .option("--root <required>", "The root directory")
    .parse(process.argv);

  rootDirectory = path.resolve(program.root || process.cwd());
  entryFile = path.join(rootDirectory, program.entry || "index.js");
  patterns = program.pattern;

  // Validate list of patterns
  if (patterns.length === 0) {
    utils.error("You must provide at least one pattern.");
    utils.hint("You can use --pattern for this.");
    process.exit(1);
  }

  // Validate root directory
  if (!rootDirectory || !fs.existsSync(rootDirectory)) {
    utils.error(`The root directory doesn't exist: ${rootDirectory}`);
    utils.hint("Make sure you're passing an existing directory as the --root argument.");
    process.exit(1);
  }

  // Validate entry point existance
  if (!entryFile || !fs.existsSync(entryFile)) {
    utils.error(`The entry point file doesn't exist: ${entryFile}`);
    utils.hint("Make sure you're passing an existing file as the --entry argument.");
    process.exit(1);
  }
} else {
  // Retrieve arguments from environment variables.
  // We can't rely on ARGV, because when the process is forked, it'll load
  // the `cli.js` file, making all validations again. So we're persisting
  // the data we need through enviroment variables.
  rootDirectory = process.env.SERVER_RELOAD_ROOT_DIRECTORY;
  entryFile = process.env.SERVER_RELOAD_ENTRY_FILE;
  patterns = process.env.SERVER_RELOAD_PATTERNS.split(",");
}

process.env.SERVER_RELOAD_ROOT_DIRECTORY = rootDirectory;
process.env.SERVER_RELOAD_ENTRY_FILE = entryFile;
process.env.SERVER_RELOAD_PATTERNS = patterns.join(",");

reloader({rootDirectory, entryFile, patterns});
