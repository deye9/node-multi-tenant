/*
 * Primary file for App
 *
 */

// Dependencies
const path = require('path'),
  {init: cliInit} = require('./lib/cli'),
  {createTenant: createTenant} = require('./lib/handlers');

// Declare the app
let app = {};

/**
 * Init function
 *
 */
app.init = () => {
  // Start the CLI
  cliInit();
};

// Export the app
module.exports = {
  init: () => app.init(),
  createTenant: (fqdn) => createTenant(fqdn)
};