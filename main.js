/*
 * Primary file for App
 *
 */

// Dependencies
const handlers = require('./lib/handlers'),
  {
    init: cliInit
  } = require('./lib/cli'),
  {
    TenantRepository
  } = require('./lib/Repository');

// get the reference of EventEmitter class of events module
const events = require('events');

// create an object of EventEmitter class by using above reference
global.em = new events.EventEmitter();

// Declare the app
let app = {};

/**
 * Init function
 *
 */
app.init = async () => {

  // Start the CLI
  cliInit();

  em.emit('requestUrl', 'Default');

  // Get a reference to the TenantRepository and reset the DB.
  const tenant = await new TenantRepository();
  // db = await tenant.currentDB();

  // await tenant.init();
  // await handlers.createTenant('andela1.localhost:3000');

  // const result = await tenant.findById(1);
  // console.log(result);
};

// Export the app
module.exports = {
  init: () => app.init(),
  currentDB: () => tenant.currentDB(),
  createTenant: (fqdn) => handlers.createTenant(fqdn),
  tenantExists: (fqdn) => handlers.tenantExists(fqdn),
  deleteTenant: (fqdn) => handlers.deleteTenant(fqdn),
  updateTenant: (fqdn, dataObject) => handlers.updateTenant(fqdn, dataObject),
  getTenantConnectionString: (fqdn) => handlers.getTenantConnectionString(fqdn)
};