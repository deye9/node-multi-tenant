/*
 * Request Handlers
 *
 */

// Dependencies
require('dotenv').config();
const db = require('../database/models'),
    HttpStatus = require('http-status-codes'),
    PostgreRepository = require('../database/repositories/repository');

// Define all the handlers
const handlers = {};

/*
 * JSON API Handlers
 *
 */

// Ping
handlers.ping = (data, callback) => {
    callback(HttpStatus.OK);
};

// Not-Found
handlers.notFound = (data, callback) => {
    callback(HttpStatus.NOT_FOUND);
};

// Start the db.
db.init();

// Users
handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(HttpStatus.METHOD_NOT_ALLOWED);
    }
};

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: email
// Optional data: firstName, lastName
handlers._users.post = async (data, callback) => {
    // Check that all required fields are filled out
  const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;

  if (firstName && lastName && email) {
    const sequelizeRepo = new PostgreRepository(db.sequelize, 'Users');
    const result = await sequelizeRepo.add(data.payload);
    callback(result['Status Code'] === undefined ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR, result);
  }
};

// Required data: phone
// Optional data: none
handlers._users.get = () => {

};

// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = () => {

};

// Required data: phone
// Cleanup old checks associated with the user
handlers._users.delete = () => {

};

// Export the handlers
module.exports = handlers;