/*
 * Primary file for App
 *
 */

// Dependencies
const os = require('os'),
  cli = require('./lib/cli'),
  cluster = require('cluster'),
  server = require('./lib/server');

  // Declare the app
let app = {};

// Init function
app.init = async (callback) => {

  // If we're on the master thread, start the background workers and the CLI
  if (cluster.isMaster) {

    // Fork the process
    const cpus = os.cpus()
    for (const cpu of cpus) {
      await cluster.fork();
    }

    // Start the CLI
    cli.init();

  } else {
    // If we're not on the master thread, start the HTTP server
    server.init();
  }
};

// Self invoking only if required directly
if (require.main === module) {
  app.init(() => {});
}

// Export the app
module.exports = app;