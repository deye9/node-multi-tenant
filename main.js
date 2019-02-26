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

  // Get a reference to the TenantRepository and reset the DB.
  const tenant = await new TenantRepository();
  db = await tenant.currentDB();

  // await tenant.init();
  // await handlers.createTenant('andela1.localhost:3000');
  // 

  // const result = await tenant.findById(1);
  // console.log(result);
  em.emit('requestUrl', 'Default');

  
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