/*
 *
 * Configuaration file for the Node Multi Tenant Application.
 *
 */

// Dependencies
require('dotenv').config();

module.exports = {
    /**
     * Contains all the paths to your datastores.
     */
    'datastore': {
         modelsfolder: 'path to the folder containing your models',
         seedersfolder: 'path to the folder containing your seeders',
         migrationsfolder: 'path to the folder containing your migrations',
         dbconfigfile: 'path to the db config file containing all your connection string details'
    },
    'models': {
        'tenancy_hostname': 'tenancy_hostname.js',
    }
};
