/*
 * Request Handlers
 *
 */

// Dependencies
const cli = require('./cli'),
    path = require('path'),
    uuid4 = require('uuid/v4'),
    { GenericRepository, RepositoryError } = require('./Repository'),
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
     * creates a tenant
     *
     * @param {String} fqdn [Fully Qualified Domain Name]
     * @param {String} email
     * @param {String} password
     */
    connectionResolver(fqdn, email, password) {
        const fileContent = fileReader.readconfig();
        const migrationPath = path.resolve(fileContent.datastore.migrationsfolder);

        console.log(global.db.sequelize.options);
        console.log(global.db.sequelize.options.host);
        console.log(global.db.sequelize.options.port);
        console.log(global.db.sequelize.options.dialect);
        console.log(global.db.sequelize.options.username);
        console.log(global.db.sequelize.options.password);
        console.log(global.db.sequelize.options.database);
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
     * @returns {Promise<<Model>}
     */
    async createTenant(fqdn) {
        try {
            const uuid = uuid4();

            // Register the website
            const websiteRepo = new GenericRepository(global.db.sequelize, 'websites');
            const siteDetails = await websiteRepo.add({
                "uuid": uuid
            });

            // Register the hostname configuration
            const hostnameRepo = new GenericRepository(global.db.sequelize, 'hostname');
            await hostnameRepo.add({
                "fqdn": fqdn,
                "force_https": true,
                "website_id": siteDetails.dataValues.id
            });

            // Create a new instance of the tenant DB using the uuid specified.
            await handlers.createTenantDB(uuid);

            return {"website_id": siteDetails.dataValues.id, "uuid": uuid, "fqdn": fqdn};
        } catch (e) {
            return new RepositoryError('DB', `Unable to create Tenant ${fqdn}`, e);
        }
    },

    /**
     * check if tenant exists
     *
     * @param {String} fqdn Fully Qualified Domain Name
     * @returns {Promise<<Model>}
     */
    async tenantExists(fqdn) {
        try {
            // Retrieve the hostname configuration
            const hostnameRepo = new GenericRepository(global.db.sequelize, 'hostname');
            const results = await hostnameRepo.findOne({
                "fqdn": fqdn
            });
            return results.dataValues;
        } catch (e) {
            return new RepositoryError('DB', `Unable to retrieve details for Tenant "${fqdn}"`, e);
        }
    },

    /**
     * delete tenant
     *
     * @param {String} fqdn Fully Qualified Domain Name
     */
    deleteTenant(fqdn) {

    },

    /**
     * makes the user an admin
     *
     * @param {String} name
     * @param {String} email
     * @param {String} password
     */
    makeAdmin(name, email, password) {

    }

};

// Start the db.
// db.init();

// // Create Tenant
// handlers.createTenant = () => {
//     console.log('created');
// };

// Delete Tenant

// Tenant identification

// Database Connections

// Export the handlers
module.exports = handlers;