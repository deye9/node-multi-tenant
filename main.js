/*
 * Primary file for App
 *
 */

// Dependencies
const cli = require('./lib/cli'),
  handlers = require('./lib/handlers');

// Declare the app
let app = {};

// Init function
app.init = () => {
  // Start the CLI
  cli.init();
};

// Export the app
module.exports = {
  init: () => app.init(),
  createTenant: () => handlers.createTenant()
};