'use strict';

/*
 * Request Handlers
 *
 */

// Dependencies
let tenantRepo;
const cli = require('./cli');

const path = require('path');

const {
  TenantRepository
} = require('./repository');
require('dotenv').config();

const defineTenantRepo = async () => {
  tenantRepo = await new TenantRepository();
};

defineTenantRepo();

// Define all the handlers
const handlers = {

  /**
     * creates a db for the newly register tenant and performs all needed migrations
     *
     * @param String uuid
     * @returns void
     */
  async createTenantDB (uuid) {
    const db = tenantRepo.db['default'].sequelize;
    const migrationPath = path.resolve(tenantRepo.migrationsfolder);
    const seedersPath = path.resolve(tenantRepo.fileContent.datastore.seedersfolder);
    const connectionString = `${db.options.dialect}://${db.config.username}:${db.config.password}@${db.config.host}:${db.config.port}/${uuid}`;

    await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:create --url ${connectionString}`);

    cli.logger('Performing Migrations');
    await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:migrate --url ${connectionString} --migrations-path=${migrationPath}/tenants`);

    cli.logger('Seeding all database');
    await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:seed:all --url ${connectionString} --seeders-path ${seedersPath}`);

    await tenantRepo.resetPool(connectionString, uuid);

    console.log(`Done setting up tenant database ${uuid}`);
  },

  /**
     * creates a tenant
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     * @throws RepositoryError
     */
  async createTenant (fqdn) {
    // Register the hostname configuration
    const result = await tenantRepo.add({
      'fqdn': fqdn,
      'force_https': true
    });

    // Create a new instance of the tenant DB using the uuid specified.
    await handlers.createTenantDB(result.uuid);

    return {
      'website_id': result.id,
      'uuid': result.uuid,
      'fqdn': fqdn
    };
  },

  /**
     * retrieves the uuid for the specified tenant
     *
     * @param String fqdn
     * @returns Promise<Object>
     * @throws RepositoryError
     */
  async tenantDbUUID (fqdn) {
    // Set the Model Name
    tenantRepo.model = 'hostname';

    // Change the current DB
    const db = await tenantRepo.db['default'].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model('hostname');

    // Retrieve the tenant database UUID configuration
    const result = await tenantRepo.findOne({
      'fqdn': fqdn
    });
    return result;
  },

  /**
     * deletes a tenant's records from the DB alongside the created DB.
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<integer>
     * @throws RepositoryError
     */
  async deleteTenant (fqdn) {
    // Retrieve the tenant database UUID configuration
    const dbID = await handlers.tenantDbUUID(fqdn);
    const db = tenantRepo.db[dbID.uuid].sequelize;
    const connectionString = `${db.options.dialect}://${db.config.username}:${db.config.password}@${db.config.host}:${db.config.port}/${dbID.uuid}`;

    tenantRepo.model = 'hostname';
    tenantRepo.currentDb = 'default';

    // Unregister the hostname configuration
    const result = await tenantRepo.remove({
      'fqdn': fqdn
    });

    // Close all sequelize Connections to the Database.
    await tenantRepo.db[dbID.uuid].sequelize.close();

    // Removes the instance of the tenant DB using the fqdn specified.
    await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:drop --url ${connectionString}`);

    cli.logger(`Successfully dropped database for tenant ${fqdn}`);

    // Delete the reference from the database pool.
    await delete tenantRepo.db[dbID.uuid];

    return result;
  },

  /**
     * checks if the tenant exists
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     * @throws RepositoryError
     */
  async tenantExists (fqdn) {
    // Retrieve the hostname configuration
    const results = await tenantRepo.findOne({
      'fqdn': fqdn
    });
    return results;
  },

  /**
     * update the tenant record to the new records passed in.
     *
     * @param String fqdn
     * @param Object dataObject
     * @returns Promise<Array<affectedCount>>
     * @throws RepositoryError
     */
  async updateTenant (fqdn, dataObject) {
    const tenantDetails = await handlers.tenantExists(fqdn);

    // loop through the dataObject and overwrite the tenantDetails with it's content.
    Object.keys(dataObject).forEach((key) => {
      if (['id', 'fqdn', 'uuid', 'createdAt', 'deletedAt'].indexOf(key) === -1) {
        tenantDetails[key] = dataObject[key];
      }
    });

    // update the hostname with new tenantDetails
    const result = await tenantRepo.update({
      id: tenantDetails.id
    }, tenantDetails);
    return result;
  },

  /**
     * returns the connection string of the current / active tenant.
     * @returns String
     */
  async getTenantConnectionString () {
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;
    return `${db.options.dialect}://${db.config.username}:${db.config.password}@${db.config.host}:${db.config.port}/${db.config.database}`;
  },

  /**
     * truncates a database table.
     * @returns Promise<Integer> The number of destroyed rows
     */
  async truncate (modelName) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    // Truncate the database table.
    const result = await tenantRepo.truncate();
    return result;
  },

  /**
     * remove the record from the tenant
     * using the model name and key supplied
     *
     * @param String modelName
     * @param Object key
     * @returns Promise<integer>
     * @throws RepositoryError
     */
  async delete (modelName, key) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    // remove the record from the database.
    const result = await tenantRepo.remove(key);
    return result;
  },

  /**
     * creates a record in the tenant
     * using the model name supplied
     *
     * @param String modelName
     * @param Object dataObject
     * @returns Promise<Model[]>
     * @throws RepositoryError
     */
  async create (modelName, dataObject) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    // Perform an insertion into the database and return the result.
    const result = await tenantRepo.add(dataObject);
    return result;
  },

  /**
     * updates the record in the tenant
     * using the model name and the key supplied
     *
     * @param String modelName
     * @param Object key
     * @param Object dataObject
     * @returns Array of Objects
     * @throws RepositoryError
     */
  async update (modelName, key, dataObject) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    // update the record with the new details.
    await tenantRepo.update(key, dataObject);

    // return the result
    return {
      key,
      dataObject
    };
  },

  /**
     * gets the record from the tenant
     * database by the Primary Key given.
     *
     * @param String modelName
     * @param Integer id
     * @returns Promise<Model>
     * @throws RepositoryError
     */
  async findById (modelName, id) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    // retrieve record by id
    const result = await tenantRepo.findById(id);
    return result;
  },

  /**
     * gets the first record from the tenant
     * database matching the criteria given.
     *
     * @param String modelName
     * @param Object key
     * @returns Promise<Model>
     * @throws RepositoryError
     */
  async findFirst (modelName, key) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    // retrieve first record from DB.
    const result = await tenantRepo.findOne(key);
    return result;
  },

  /**
     * gets an array of the values from the
     * tenant based on conditions specified
     *
     * @param String modelName
     * @param Object key
     * @returns Promise<Model[]>
     * @throws RepositoryError
     */
  async findAll (modelName, key) {
    // Set the Model Name
    tenantRepo.model = modelName;

    // Change the current DB
    const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

    // Bind the object to the TenantRepo collection.
    tenantRepo.collection = db.model(modelName);

    return key === 'undefined' ? tenantRepo.getAll() : tenantRepo.findAll(key);
  },

  /**
     * execute a raw sql query against the database
     *
     * @param String sqlCommand
     * @returns Promise<Array<<Model>>
     * @throws RepositoryError
     */
  async executeQuery (sqlCommand) {
    const result = await tenantRepo.execute(sqlCommand);
    return result;
  }
};

// Export the handlers
module.exports = handlers;
