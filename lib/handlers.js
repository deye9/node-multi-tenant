/*
 * Request Handlers
 *
 */

// Dependencies
let tenantRepo;
const cli = require('./cli'),
    path = require('path'),
    uuid4 = require('uuid/v4'),
    {
        TenantRepository,
        RepositoryError
    } = require('./Repository');
require('dotenv').config();

const defineTenantRepo = async () => {
    tenantRepo = await new TenantRepository('hostname');
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
    async createTenantDB(uuid) {
        const db = tenantRepo.db['default'].sequelize.config;
        const migrationPath = path.resolve(tenantRepo.migrationsfolder);

        const connectionString = `${process.env.DB_TYPE}://${db.username}:${db.password}@${db.host}:${db.port}/${uuid}`;

        await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:create --url ${connectionString}`);

        console.log('Performing Migrations');
        await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:migrate --url ${connectionString} --migrations-path=${migrationPath}/tenants`);

        console.log('Seeding all database');
        await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:seed:all --url ${connectionString}`);

        await tenantRepo.resetPool(connectionString, uuid);

        // Test to make sure we can connect to the db.
        tenantRepo.db[uuid].sequelize
            .authenticate()
            .then(() => {
                console.log(`Connection established successfully with database ${uuid}.`);
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            });
    },

    /**
     * creates a tenant
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     */
    async createTenant(fqdn) {
        try {
            const uuid = uuid4();

            // Register the hostname configuration
            const result = await tenantRepo.add({
                'uuid': uuid,
                'fqdn': fqdn,
                'force_https': true
            });

            // Create a new instance of the tenant DB using the uuid specified.
            await handlers.createTenantDB(uuid);

            return {
                'website_id': result.dataValues.id,
                'uuid': uuid,
                'fqdn': fqdn
            };
        } catch (e) {
            return new RepositoryError('DB', `Unable to create Tenant ${fqdn}`, e);
        }
    },

    /**
     * retrieves the uuid for the specified tenant
     *
     * @param String fqdn
     * @returns Promise<Object>
     */
    async tenantDbUUID(fqdn) {
        try {
            // Retrieve the tenant database UUID configuration
            const result = await tenantRepo.findOne({
                'fqdn': fqdn
            });
            return result.dataValues.uuid;
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve UUID detail for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * deletes a tenant's records from the DB alongside the created DB.
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     */
    async deleteTenant(fqdn) {
        try {
            // Retrieve the tenant database UUID configuration
            const dbID = await handlers.tenantDbUUID(fqdn);
            const db = tenantRepo.db[dbID].sequelize.config;
            const connectionString = `${process.env.DB_TYPE}://${db.username}:${db.password}@${db.host}:${db.port}/${dbID}`;

            // Unregister the hostname configuration
            await tenantRepo.remove({
                'fqdn': fqdn
            });

            // Close all sequelize Connections to the Database.
            tenantRepo.db[dbID].sequelize.close().then(async () => {
                // Removes the instance of the tenant DB using the fqdn specified.
                await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:drop --url ${connectionString}`);
                console.log(`Successfully dropped database for tenant ${fqdn}`);

                // Delete the reference from the database pool.
                await delete tenantRepo.db[dbID];
            });
        } catch (e) {
            return new RepositoryError('DB', `Unable to delete Tenant ${fqdn}`, e);
        }
    },

    /**
     * checks if the tenant exists
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     */
    async tenantExists(fqdn) {
        try {
            // Retrieve the hostname configuration
            const results = await tenantRepo.findOne({
                'fqdn': fqdn
            });
            return results.dataValues;
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * update the tenant record to the new records passed in.
     *
     * @param String fqdn
     * @param Object dataObject
     * @returns Promise<Model>
     */
    async updateTenant(fqdn, dataObject) {
        try {
            const tenantDetails = await handlers.tenantExists(fqdn);

            // loop through the dataObject and overwrite the tenantDetails with it's content.
            Object.keys(dataObject).forEach((key) => {
                if (['id', 'fqdn', 'uuid', 'createdAt', 'deletedAt'].indexOf(key) == -1) {
                    tenantDetails[key] = dataObject[key];
                }
            });

            // update the hostname with new tenantDetails
            await tenantRepo.update(tenantDetails, {
                id: tenantDetails.id
            });
        } catch (e) {
            return new RepositoryError('DB', `Unable to update details for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * returns the connection string of the current / active tenant.
     * @returns String
     */
    async getTenantConnectionString() {
        const db = await tenantRepo.db[tenantRepo.currentDb].sequelize.config;
        return `${process.env.DB_TYPE}://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
    },

    /**
     * remove the record from the tenant
     * using the model name and key supplied
     *
     * @param String modelName
     * @param Object key
     * @returns Object
     */
    async delete(modelName, key) {
        try {
            // Set the Model Name
            tenantRepo.model = modelName;

            // Change the current DB
            const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

            // Bind the object to the TenantRepo collection.
            tenantRepo.collection = db.model(modelName);

            // remove the record from the database.
            await tenantRepo.remove(key);

            // return the result
            return {key};
        } catch (e) {
            return new RepositoryError('DB', `Unable to update details for Model "${modelName}"`, e);
        }
    },

    /**
     * creates a record in the tenant
     * using the model name supplied
     *
     * @param String modelName
     * @param Object dataObject
     * @returns Promise<Model>
     */
    async create(modelName, dataObject) {
        try {
            // Set the Model Name
            tenantRepo.model = modelName;

            // Change the current DB 
            const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

            // Bind the object to the TenantRepo collection.
            tenantRepo.collection = db.model(modelName);

            // Perform an insertion into the database and return the result.
            return await tenantRepo.add(dataObject);
        } catch (e) {
            return new RepositoryError('DB', `Unable to create details for Model "${modelName}"`, e);
        }
    },

    /**
     * updates the record in the tenant
     * using the model name and the key supplied
     * 
     * @param String modelName
     * @param Object key
     * @param Object dataObject
     * @returns Array of Objects
     */
    async update(modelName, key, dataObject) {
        try {
            // Set the Model Name
            tenantRepo.model = modelName;

            // Change the current DB
            const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

            // Bind the object to the TenantRepo collection.
            tenantRepo.collection = db.model(modelName);

            // update the record with the new details.
            await tenantRepo.update(dataObject, key);

            // return the result
            return {key, dataObject};
        } catch (e) {
            return new RepositoryError('DB', `Unable to update details for Model "${modelName}"`, e);
        }
    },

    /**
     * gets the record from the tenant
     * database by the Primary Key given.
     *
     * @param String modelName
     * @param Integer id
     * @returns Promise<Model>
     */
    async findById(modelName, id) {
        try {
            // Set the Model Name
            tenantRepo.model = modelName;

            // Change the current DB
            const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;
            
            // Bind the object to the TenantRepo collection.
            tenantRepo.collection = db.model(modelName);

            // retrieve record by id
            return await tenantRepo.findById(id);
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Model "${modelName}"`, e);
        }
    },

    /**
     * gets the first record from the tenant
     * database matching the criteria given.
     *
     * @param String modelName
     * @param Object key
     * @returns Promise<Model>
     */
    async findFirst(modelName, key) {
        try {
            // Set the Model Name
            tenantRepo.model = modelName;

            // Change the current DB
            const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;
            
            // Bind the object to the TenantRepo collection.
            tenantRepo.collection = db.model(modelName);

            // retrieve first record from DB.
            return await tenantRepo.findOne(key);
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Model "${modelName}"`, e);
        }
    },

    /**
     * gets an array of the values from the
     * tenant based on conditions specified
     *
     * @param String modelName
     * @param Object key
     * @returns Promise<Array<Model>>
     */
    async findAll(modelName, key) {
        try {
            // Set the Model Name
            tenantRepo.model = modelName;

            // Change the current DB
            const db = await tenantRepo.db[tenantRepo.currentDb].sequelize;

            // Bind the object to the TenantRepo collection.
            tenantRepo.collection = db.model(modelName);

            if (typeof key === 'undefined') {
                // retrieve all records.
                return await tenantRepo.getAll();
            } else {
                // retrieve all records via key supplied
                return await tenantRepo.findAll(key);
            }
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Model "${modelName}"`, e);
        }
    },

};

// Export the handlers
module.exports = handlers;