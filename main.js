/*
 * Primary file for App
 *
 */

// Dependencies
const cli = require('./lib/cli');

  // Declare the app
let app = {};

// Init function
app.init = async (callback) => {    
    // Start the CLI
    cli.init();
};

// Self invoking only if required directly
if (require.main === module) {
  app.init(() => {});
}

// Export the app
module.exports = app;