/*
 * Library for storing and editing data
 *
 */

'use strict';

// Dependencies
require('dotenv').config();

const fs = require('fs');

/**
 * Class for handling all operations surrounding the file system
 */
class files {

  /**
   * Class constructor
   * @param {String} tenantPath 
   */
  constructor() {  }

  static readConfig(IsTest = true) {
    if (IsTest) {
      return require(process.env.PWD + '/tenants/tenancy.js');
    } else {
      return {
        'datastore': {
          modelsfolder: 'tests/database/models', // path to the folder containing your models
          seedersfolder: 'tests/database/seeders', //path to the folder containing your seeders
          migrationsfolder: 'tests/database/migrations', // path to the folder containing your migrations
          dbconfigfile: 'tests/database/models/index' // path to the db config file containing all your connection string details
     },
     'models-shared': {
         'tenancy_hostname': 'hostname.js',
     }
      };
    }
  }

  static requireFile(filename) {
    return require(process.env.PWD + '/' + filename);
  }

  static async getModelFiles(directory, sharedModels) {
    const fullPath = process.env.PWD + '/' + directory;

    // read the files in
    const files = await fs.readdirSync(fullPath);

    // convert from Object to Array
    const ExcludeFiles = Object.values(sharedModels).concat(['index.js']);

    // search for inclusion inside the callback function and remove by value
    const filteredItems = files.filter(item => !ExcludeFiles.includes(item));

    return filteredItems;
  }

}

  // Export the module
  module.exports = {
    files
  };