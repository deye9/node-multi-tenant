/*
 * Primary file for App
 *
 */

// Dependencies
const handlers = require('./lib/handlers'),
  {init: cliInit} = require('./lib/cli');

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
  createTenant: (fqdn) => handlers.createTenant(fqdn),
  tenantExists: (fqdn) => handlers.tenantExists(fqdn),
  deleteTenant: (fqdn) => handlers.deleteTenant(fqdn),
  updateTenant: (fqdn, dataObject) => handlers.updateTenant(fqdn, dataObject),
  getTenantConnectionString: (fqdn) => handlers.getTenantConnectionString(fqdn)
};