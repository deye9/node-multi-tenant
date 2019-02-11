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
  console.log('1 = ' , path);
  console.log('2 = ' , __dirname);
  
  //   let tenantPath = path(__dirname);

  cliInit();
};

// Export the app
module.exports = {
  init: () => app.init(),
  createTenant: (fqdn, email, password) => createTenant(fqdn, email, password)
};