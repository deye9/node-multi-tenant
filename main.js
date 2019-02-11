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
  console.log('1 = ', __dirname);
  console.log('2 = ', path.dirname(__dirname));
  console.log('3 = ', process.env.TENANT_PATH);
  // /Users/andelatsm/Desktop/Projects/NodeApps/ESB/node_modules/node_multi_tenant
  
  //   let tenantPath = path(__dirname);

  cliInit();
};

// Export the app
module.exports = {
  init: () => app.init(),
  createTenant: (fqdn, email, password) => createTenant(fqdn, email, password)
};