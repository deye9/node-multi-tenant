/*
 * Request Handlers
 *
 */

// Dependencies
const { files: fileReader } = require('../lib/fileHandler'),
    TenantRepository = require('../lib/Repository');

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
        console.log(global.db.sequelize.options);
        console.log(global.db.sequelize.options.host);
        console.log(global.db.sequelize.options.port);
        console.log(global.db.sequelize.options.dialect);
        console.log(global.db.sequelize.options.username);
        console.log(global.db.sequelize.options.password);
        console.log(global.db.sequelize.options.database);
    },

    /**
     * creates a tenant
     *
     * @param {String} name
     * @param {String} email
     * @param {String} password
     */
    async createTenant(name, email, password) {

        const websiteRepo = new TenantRepository(global.db.sequelize, 'websites');
        const result1 = await websiteRepo.add({
            "uuid": name
        });

        console.log(result1);

        const hostnameRepo = new TenantRepository(global.db.sequelize, 'hostname');
        const result = await hostnameRepo.add({
            "fqdn": name,
            "force_https": true,
            "redirect_to": email,
            "website_id": 1
        });

        console.log(result);
        // callback(result['Status Code'] === undefined ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR, result);
        const ii = await handlers.getmodelPath("tenancy_hostname");
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