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
         modelsfolder: 'database/models', // path to the folder containing your models
         seedersfolder: 'database/seeders', //path to the folder containing your seeders
         migrationsfolder: 'database/migrations', // path to the folder containing your migrations
         dbconfigfile: 'database/models/index' // path to the db config file containing all your connection string details
    },
    'models': {
        'tenancy_hostname': 'hostname.js',
    }
};
