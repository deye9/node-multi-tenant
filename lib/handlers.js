/*
 * Request Handlers
 *
 */

// Dependencies
const cli = require('./cli'),
    path = require('path'),
    uuid4 = require('uuid/v4'),
    {
        TenantRepository,
        RepositoryError
    } = require('./Repository'),
    {
        files: fileReader
    } = require('../lib/fileHandler');

// Define all the handlers
const handlers = {

    async getmodelPath(modelIdentifier) {
        const fileContent = await fileReader.readconfig();
        return fileContent.models[modelIdentifier];
    },

    /**
     * builds out the connectionstring to the database for the tenant.
     *
     * @param {String} fqdn [Fully Qualified Domain Name]
     * @returns {Promise<String>}
     */
    async connectionResolver(uuid) {
        try {
            const connectionString = `${global.db.sequelize.options.dialect}://${global.db.sequelize.options.username}:${global.db.sequelize.options.password}@${global.db.sequelize.options.host}:${global.db.sequelize.options.port}/${uuid}`;
            return connectionString;
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * retrieves the uuid for the specified tenant
     *
     * @param {*} fqdn
     * @returns {Promise<Object>}
     */
    async tenantDbUUID(fqdn) {
        try {
            // Retrieve the tenant database UUID configuration
            const tenantuuid = new TenantRepository(global.db.sequelize, 'hostname');
            const result = await tenantuuid.findOne({
                "fqdn": fqdn
            });
            return result.dataValues.uuid;
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve UUID detail for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * creates a db for the newly register tenant and performs all needed migrations
     *
     * @param {String} uuid
     */
    async createTenantDB(uuid) {
        const fileContent = fileReader.readconfig();
        const migrationPath = path.resolve(fileContent.datastore.migrationsfolder);

        let connectionString = `${global.db.sequelize.options.dialect}://${global.db.sequelize.options.username}:${global.db.sequelize.options.password}@${global.db.sequelize.options.host}:${global.db.sequelize.options.port}/${uuid}`;

        await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:create --url ${connectionString}`);

        console.log("Performing Migrations");
        await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:migrate --url ${connectionString} --migrations-path=${migrationPath}/tenants`);

        console.log("Seeding all database");
        await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:seed:all --url ${connectionString}`);
    },

    /**
     * creates a tenant
     *
     * @param {String} fqdn Fully Qualified Domain Name
     * @returns {Promise<Model>}
     */
    async createTenant(fqdn) {
        try {
            const uuid = uuid4();

            // Register the hostname configuration
            const hostnameRepo = new TenantRepository(global.db.sequelize, 'hostname');
            await hostnameRepo.add({
                "uuid": uuid,
                "fqdn": fqdn,
                "force_https": true
            });

            // Create a new instance of the tenant DB using the uuid specified.
            await handlers.createTenantDB(uuid);

            return {
                "website_id": siteDetails.dataValues.id,
                "uuid": uuid,
                "fqdn": fqdn
            };
        } catch (e) {
            return new RepositoryError('DB', `Unable to create Tenant ${fqdn}`, e);
        }
    },

    /**
     * check if tenant exists
     *
     * @param {String} fqdn Fully Qualified Domain Name
     * @returns {Promise<Model>}
     */
    async tenantExists(fqdn) {
        try {
            // Retrieve the hostname configuration
            const hostnameRepo = new TenantRepository(global.db.sequelize, 'hostname');
            const results = await hostnameRepo.findOne({
                "fqdn": fqdn
            });
            return results.dataValues;
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * deletes a tenant's records from the DB alongside the created DB.
     *
     * @param {String} fqdn Fully Qualified Domain Name
     * @returns {Promise<Model>}
     */
    async deleteTenant(fqdn) {
        try {
            // Retrieve the tenant database UUID configuration
            const uuid = await handlers.tenantDbUUID(fqdn);

            // Unregister the hostname configuration
            const hostnameRepo = new TenantRepository(global.db.sequelize, 'hostname');
            await hostnameRepo.remove({
                "fqdn": fqdn
            });

            // Removes the instance of the tenant DB using the fqdn specified.            
            const connectionString = await handlers.connectionResolver(uuid);
            await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:drop --url ${connectionString}`);
            console.log(`Successfully dropped database for tenant ${fqdn}`);
        } catch (e) {
            return new RepositoryError('DB', `Unable to delete Tenant ${fqdn}`, e);
        }
    },

    /**
     * update the tenant record to the new records passed in.
     *
     * @param {String} fqdn
     * @param {Object} dataObject
     * @returns
     */
    async updateTenant(fqdn, dataObject) {
        try {
            
            const tenantDetails = await handlers.tenantExists(fqdn);
            
            // Loop through the dataObject and overwrite the tenantDetails with it's content.
            Object.keys(dataObject).forEach((key) => {
                if (['id', 'fqdn', 'uuid', 'createdAt', 'deletedAt'].indexOf(key) == -1) {
                    tenantDetails[key] = dataObject[key];
                }
            });

            //Update the hostname with new new tenantDetails
            const hostnameRepo = new TenantRepository(global.db.sequelize, 'hostname');
            await hostnameRepo.update(tenantDetails, {id: tenantDetails.id});
        } catch (e) {
            return new RepositoryError('DB', `Unable to update details for Tenant "${fqdn}"`, e);
        }
    }
};

// Export the handlers
module.exports = handlers;