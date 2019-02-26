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
    require('dotenv').config();

    const fileContent = fileReader.readconfig();
    // const migrationPath = path.resolve(fileContent.datastore.migrationsfolder);

const defineTenantRepo = async () => {
    tenantRepo = await new TenantRepository('hostname');
}

// Define all the handlers
const handlers = {

    async getTenantConnectionString() {
        // const tenantConnection = new TenantRepository('hostname');
        // let connectString = await tenantConnection.connectionResolver();
        // console.log(connectString);

        // let fqdn = 'konga.test.dev';
        // const fileContent = fileReader.readconfig();
        // const sharedModels = fileContent['models-shared'];
        // const db = fileReader.requireFile(fileContent.datastore.dbconfigfile);
        
        // objValues = Object.keys(sharedModels).map((k) => sharedModels[k].replace(/.js/gi, ''));
        
        // console.log('objValues:', objValues);
    },

    /**
     * builds out the connectionstring to the database for the tenant.
     *
     * @param {String} fqdn [Fully Qualified Domain Name]
     * @returns {Promise<String>}
     */
    async connectionResolver(uuid) {
        try {
            db = await tenantRepo.currentDB();
            console.log('Hi ', db.sequelize.config);
            // const connectionString = `${process.env.DB_TYPE}://${db.sequelize.config.username}:${db.config.password}@${db.config.host}:${db.config.port}/${uuid}`;
            // return connectionString;
        } catch (e) {
            console.log(e);
            return new RepositoryError('DB', `Unable to retrieve details for Tenant "${uuid}"`, e);
        }
    },

    /**
     * retrieves the uuid for the specified tenant
     *
     * @param String fqdn
     * @returns Promise<Object>
     */
    async tenantDbUUID(fqdn) {
        try {
            // Retrieve the tenant database UUID configuration
            const result = await tenantRepo.findOne({
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
     * @param String uuid
     */
    async createTenantDB(uuid) {
        const connectionString = await handlers.connectionResolver(uuid);

        // await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:create --url ${connectionString}`);

        // console.log("Performing Migrations");
        // await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:migrate --url ${connectionString} --migrations-path=${migrationPath}/tenants`);

        // console.log("Seeding all database");
        // await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:seed:all --url ${connectionString}`);

        // await tenantRepo.resetDB(uuid);
    },

    /**
     * creates a tenant
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     */
    async createTenant(fqdn) {
        try {
            const uuid = uuid4();

            // Register the hostname configuration

            const result = await tenantRepo.add({
                "uuid": uuid,
                "fqdn": fqdn,
                "force_https": true
            });

            // Create a new instance of the tenant DB using the uuid specified.
            await handlers.createTenantDB(uuid);

            return {
                "website_id": result.dataValues.id,
                "uuid": uuid,
                "fqdn": fqdn
            };
        } catch (e) {
            console.log(e);
            return new RepositoryError('DB', `Unable to create Tenant ${fqdn}`, e);
        }
    },

    /**
     * check if tenant exists
     *
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     */
    async tenantExists(fqdn) {
        try {
            // Retrieve the hostname configuration
            const results = await tenantRepo.findOne({
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
     * @param String fqdn Fully Qualified Domain Name
     * @returns Promise<Model>
     */
    async deleteTenant(fqdn) {
        try {
            // Retrieve the tenant database UUID configuration
            const uuid = await handlers.tenantDbUUID(fqdn);

            // // Unregister the hostname configuration
            // await tenantRepo.remove({
            //     "fqdn": fqdn
            // });

            // Removes the instance of the tenant DB using the fqdn specified.            
            const connectionString = await handlers.connectionResolver(uuid);
            console.log(uuid, JSON.stringify(connectionString));

            // await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:drop --url ${connectionString}`);
            // console.log(`Successfully dropped database for tenant ${fqdn}`);

            // delete db[uuid];
            // db[uuid].close();
            db[uuid]
            .authenticate()
            .then(() => {
                console.log(`Connection has been established successfully to database ${dbID}`);
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            });
        } catch (e) {
            console.log(e);
            return new RepositoryError('DB', `Unable to delete Tenant ${fqdn}`, e);
        }
    },

    /**
     * update the tenant record to the new records passed in.
     *
     * @param String fqdn
     * @param Object dataObject
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
            await tenantRepo.update(tenantDetails, {id: tenantDetails.id});
        } catch (e) {
            return new RepositoryError('DB', `Unable to update details for Tenant "${fqdn}"`, e);
        }
    }
};

defineTenantRepo().then((mode) => {
    // Export the handlers
    module.exports = handlers;
});