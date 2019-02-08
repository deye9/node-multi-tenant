/*
 * Primary file for App
 *
 */

// Dependencies
const cli = require('./lib/cli'),
  server = require('./lib/server');

  // Declare the app
let app = {};

// Init function
app.init = async (callback) => {
    // If we're not on the master thread, start the HTTP server
    server.init();
    
    // Start the CLI
    cli.init();
};

// Self invoking only if required directly
if (require.main === module) {
  app.init(() => {});
}

// Export the app
module.exports = app;