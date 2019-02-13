/*
 * Request Handlers
 *
 */

// Dependencies
const cli = require('./cli'),
    path = require('path'),
    uuid4 = require('uuid/v4'),
    TenantRepository = require('./Repository'),
    { files: fileReader } = require('../lib/fileHandler');

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
     */
    async createTenant(fqdn) {

        // // Register the website
        const uuid = uuid4();
        // const websiteRepo = new TenantRepository(global.db.sequelize, 'websites');
        // const siteDetails = await websiteRepo.add({
        //     "uuid": uuid
        // });

        // // Register the hostname configuration
        // const hostnameRepo = new TenantRepository(global.db.sequelize, 'hostname');
        // await hostnameRepo.add({
        //     "fqdn": name,
        //     "force_https": true,
        //     "website_id": siteDetails.dataValues.id
        // });

        // Create a new instance of the tenant DB using the uuid specified.
        await handlers.createTenantDB(uuid);

        // console.log(result['Status Code']);
        // callback(result['Status Code'] === undefined ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR, result);
        // const ii = await handlers.getmodelPath("tenancy_hostname");
        // console.log(global.db.sequelize.options);
        // console.log(global.db.sequelize.options.dialect);
        // console.log(`User name is ${name} and the email is ${email}. Proposed password is ${password}`);
    },

    /**
     * delete tenant
     *
     * @param {String} name
     */
    delete(name) {

    },

    /**
     * delete tenant by FQDN [Fully Qualified Domain Name]
     *
     * @param {String} fqdn
     */
    deleteByFqdn(fqdn) {

    },

    /**
     * registers a tenant
     *
     * @param {String} name
     * @param {String} email
     * @param {String} password
     */
    registerTenant(name, email, password) {

    },

    /**
     * makes the user an admin
     *
     * @param {String} name
     * @param {String} email
     * @param {String} password
     */
    makeAdmin(name, email, password) {

    },

    /**
     * check if tenant exists
     *
     * @param {String} name
     */
    tenantExists(name) {

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