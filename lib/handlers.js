/*
 * Request Handlers
 *
 */

// Dependencies
require('dotenv').config();
// const db = require('../database/models');

// Define all the handlers
const handlers = {

    /**
     * creates a tenant
     *
     * @param {String} name
     * @param {String} email
     * @param {String} password
     */
    createTenant(name, email, password) {
        console.log('OK');
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