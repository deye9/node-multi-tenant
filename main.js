/*
 * Primary file for App
 *
 */

// Dependencies
const path = require('path'),
  {init: cliInit} = require('./lib/cli'),
  {createTenant: createTenant, tenantExists: tenantExists, 
    deleteTenant: deleteTenant, updateTenant: updateTenant} = require('./lib/handlers');

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
  createTenant: (fqdn) => createTenant(fqdn),
  tenantExists: (fqdn) => tenantExists(fqdn),
  deleteTenant: (fqdn) => deleteTenant(fqdn),
  updateTenant: (fqdn, dataObject) => updateTenant(fqdn, dataObject)
};