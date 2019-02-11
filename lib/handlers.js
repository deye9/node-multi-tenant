/*
 * Request Handlers
 *
 */

// Dependencies

// Define all the handlers
const handlers = {

    /**
     * creates a tenant
     *
     * @param {String} fqdn [Fully Qualified Domain Name]
     * @param {String} email
     * @param {String} password
     */
    connectionResolver(fqdn, email, password) {
        console.log('OK 1');
    },

    /**
     * creates a tenant
     *
     * @param {String} name
     * @param {String} email
     * @param {String} password
     */
    createTenant(name, email, password) {
        // console.log('1 = ', __dirname);
        // console.log('2 = ', path.dirname(__dirname));
        console.log('3 = ', process.env.TENANT_PATH);

        // /Users/andelatsm/Desktop/Projects/NodeApps/ESB/node_modules/node_multi_tenant
        
        //   let tenantPath = path(__dirname);
        console.log(`User name is ${name} and the email is ${email}. Proposed password is ${password}`);
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
    tenantExists(name){

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