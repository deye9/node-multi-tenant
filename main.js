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
  } = require('./lib/repository');

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

  // Get a reference to the TenantRepository 
  const tenant = await new TenantRepository();

  // Bind the connection event with the listner1 function
  em.on('requestUrl', tenant.currentDB);

  // Fire the requestUrl event.
  em.emit('requestUrl', process.env.TENANCY_DEFAULT_HOSTNAME.toLowerCase());

};

// Export the app
module.exports = {
  init: () => app.init(),
  currentDB: () => tenant.currentDB(),
  findAll: (modelName) => handlers.findAll(modelName),
  createTenant: (fqdn) => handlers.createTenant(fqdn),
  tenantExists: (fqdn) => handlers.tenantExists(fqdn),
  deleteTenant: (fqdn) => handlers.deleteTenant(fqdn),
  truncate: (modelName) => handlers.truncate(modelName),
  delete: (modelName, key) => handlers.delete(modelName, key),
  findById: (modelName, id) => handlers.findById(modelName, id),
  executeQuery: (sqlCommand) => handlers.executeQuery(sqlCommand),
  findFirst:(modelName, key) => handlers.findFirst(modelName, key),
  getTenantConnectionString: () => handlers.getTenantConnectionString(),
  create: (modelName, dataObject) => handlers.create(modelName, dataObject),
  updateTenant: (fqdn, dataObject) => handlers.updateTenant(fqdn, dataObject),
  update: (modelName, key, dataObject) => handlers.update(modelName, key, dataObject),
};