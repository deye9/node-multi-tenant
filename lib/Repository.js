'use strict';

// Dependencies
require('dotenv').config();
const autoBind = require('auto-bind'),
    Sequelize = require('sequelize'),
    {
        files: fileReader
    } = require('./fileHandler');

/**
 * Handles all related errors centrally for the application.
 *
 * @class RepositoryError
 * @extends {Error}
 */
class RepositoryError extends Error {
    /**
     * Creates an instance of RepositoryError.
     * Access the previous error message via this.previous.message
     * @param {string} category
     * @param {string} message
     * @param {Object} [previous=null]
     */
    constructor(category, title, previous = null) {
        super(title);
        this.category = category;
        this.previous = previous;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, RepositoryError);
        return {
            'Error Category': this.category,
            'Error Title': title,
            'Error Message': this.previous.message
        };
    }
}

class TenantRepository {

    /**
     * Creates an instance of TenantRepository.
     * @param {String} modelType
     */
    constructor(model) {

        return (async () => {
            this.db = null;
            this.audit = null;
            this.sequelize = null;
            this.availabledbs = null;
            this.currentDb = 'default';
        
            if (typeof process.env.NODE_ENV !== 'undefined' && process.env.NODE_ENV.toLowerCase() === 'test') {
                this.fileContent = fileReader.readConfig(false);
            } else {
                this.fileContent = fileReader.readConfig();
            }
            this.sharedModels = this.fileContent['models-shared'];
            this.modelsFolder = this.fileContent.datastore.modelsfolder;
            this.model = typeof model === 'undefined' ? 'hostname' : model;
            this.migrationsfolder = this.fileContent.datastore.migrationsfolder;

            // All async code here
            await this.init();

            // Perform the default binding
            this.sequelize = this.db[this.currentDb].sequelize;
            this.collection = this.db[this.currentDb].sequelize.model(this.model);
            autoBind(this);

            return this;
        })();
    }

    /**
     * attach the Db context to the id passed in.
     *
     * @param Object modelsPath
     * @param String connectionString
     * @param String connectionID
     */
    async attachDbContext(modelsPath, connectionString, connectionID) {
        // define the handler.
        const defaultCon = {};

        // setup a new Sequekize connection and disable logging.
        const sequelize = new Sequelize(connectionString, {
            logging: false
        });

        // perform all associations here.
        Object.values(modelsPath).map((filename) => {
            const modelName = filename.replace(/.js/gi, '');
            const model = sequelize['import'](process.env.PWD + '/' + this.modelsFolder + '/' + filename);
            defaultCon[modelName] = model;
            if (defaultCon[modelName].associate) {
                defaultCon[modelName].associate(defaultCon);
            }
        });

        defaultCon.sequelize = sequelize;
        defaultCon.Sequelize = Sequelize;

        this.db[connectionID] = defaultCon;

        // Set the audit connection
        if (connectionID.toLowerCase() !== 'default') {
            this.audit = this.db[connectionID].sequelize.model('audits');
        }
    }

    /**
     * initialize variables down
     *
     */
    async init() {
        this.db = fileReader.requireFile(this.fileContent.datastore.dbconfigfile);
        let connectionString = `${this.db.sequelize.options.dialect}://${this.db.sequelize.config.username}:${this.db.sequelize.config.password}@${this.db.sequelize.config.host}:${this.db.sequelize.config.port}/${this.db.sequelize.config.database}`;
        await this.attachDbContext(this.sharedModels, connectionString, 'default');

        // Get all available DB ID's on the DB server instance.
        await this.db.sequelize.query('select uuid from hostnames', {
                type: Sequelize.QueryTypes.SELECT
            })
            .then((result) => {
                this.availabledbs = result;
            });

        // Get the ID's of the respective Databases.
        this.availabledbs.forEach(async (element) => {
            const dbID = element.uuid;
            const _db = this.db['default'].sequelize;
            const filenames = await fileReader.getModelFiles(this.modelsFolder, this.sharedModels);
            connectionString = `${_db.options.dialect}://${_db.config.username}:${_db.config.password}@${_db.config.host}:${_db.config.port}/${dbID}`;
            await this.attachDbContext(filenames, connectionString, dbID);
        });
    }

    /**
     * adds the new connection to the db pool.
     *
     * @returns Promise<void>
     */
    async resetPool(connectionString, dbID) {
        const filenames = await fileReader.getModelFiles(this.modelsFolder, this.sharedModels);
        return await this.attachDbContext(filenames, connectionString, dbID);
    }

    /**
     * gets the current db to be used by the connection.
     *
     * @returns sequelize
     */
    async currentDB(data) {
        if (typeof data === 'undefined') {
            return;
        }

        let domain = data,
            subDomain = domain.split('.');

        if (subDomain.length > 2) {
            subDomain = subDomain[0].split('-').join(' ');
        } else {
            subDomain = subDomain[0];
        }

        if (domain.startsWith('/')) {
            domain = domain.substring(1, domain.length);
        }

        if ((domain.toLowerCase() === process.env.TENANCY_DEFAULT_HOSTNAME.toLowerCase())) {
            this.currentDb = 'default';
        } else {
            await this.db['default'].sequelize.query(`select uuid from hostnames where fqdn = '${domain}'`)
                .then((result) => {
                    this.currentDb = result[0][0].uuid;
                });
        }

        console.log('domain = ', domain);
        console.log(this.currentDb);
        return await this.db[this.currentDb].sequelize;
    }

    async auditLog(entity, action, oldvalue) {
        try {
            const audits = {};
            audits.event = action;
            audits.model = this.model;

            switch (action.toLowerCase()) {
                case 'create':
                    if (typeof entity[0] === 'undefined') {
                        audits.record_id = entity.dataValues.id;
                        audits.new_values = JSON.stringify(entity);
                        audits.old_values = JSON.stringify(oldvalue);
                    } else {
                        entity.forEach(async (record) => {
                            audits.event = action;
                            audits.model = this.model;
                            audits.record_id = record.dataValues.id;
                            audits.old_values = JSON.stringify(oldvalue);
                            audits.new_values = JSON.stringify(record.dataValues);

                            await this.audit.create(audits);
                        });
                        return;
                    }
                    break;

                case 'update':
                    audits.new_values = JSON.stringify(entity);
                    audits.record_id = Object.values(oldvalue.key)[0];
                    audits.old_values = JSON.stringify(oldvalue.oldvalue);
                    break;

                case 'remove':
                    audits.new_values = '[]';
                    audits.record_id = Object.values(entity)[0];
                    audits.old_values = JSON.stringify(oldvalue);
                    break;

                case 'truncate':
                    oldvalue.forEach(async (record) => {
                        audits.event = action;
                        audits.old_values = '[]';
                        audits.model = this.model;
                        audits.record_id = record.dataValues.id;
                        audits.new_values = JSON.stringify(record.dataValues);

                        await this.audit.create(audits);
                    });
                    return;
                }

            return await this.audit.create(audits);
        } catch (e) {
            throw new RepositoryError('DB', 'Add entity to collection failed', e);
        }
    }

    /**
     * creates a record in the specified database.
     * 
     * @param Object entity JSON data for creating the collection object
     * @return Promise<Model[]>
     */
    async add(entity) {
        try {
            let result = null;

            if (typeof entity.length === 'undefined') {
                result = await this.collection.create(entity);
            } else {
                result = await this.collection.bulkCreate(entity, {
                    returning: true
                });
            }

            if (typeof process.env.TENANCY_AUDIT_LOG !== 'undefined' && process.env.TENANCY_AUDIT_LOG.toLowerCase() === 'true') {
                await this.auditLog(result, 'Create', entity);
            }

            return result;
        } catch (e) {
            throw new RepositoryError('DB', 'Add entity to collection failed', e);
        }
    }

    /**
     * removes all occurrence of a record from the database based on key.
     * 
     * @param Object keyValue
     * @returns Promise<integer>
     */
    async remove(keyValue) {
        try {
            const oldvalue = await this.collection.findOne({
                where: keyValue
            });

            const result = await this.collection.destroy({
                where: keyValue
            });

            if (typeof process.env.TENANCY_AUDIT_LOG !== 'undefined' && process.env.TENANCY_AUDIT_LOG.toLowerCase() === 'true' && this.currentDb.toLowerCase() !== 'default') {
                await this.auditLog(keyValue, 'Remove', oldvalue);
            }
            return result;
        } catch (e) {
            throw new RepositoryError('DB', `Failed removing records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    }

    /**
    * truncates a database table
    * 
    * @returns Promise<Integer> The number of destroyed rows
    */
    async truncate() {
        try {
            const oldvalue = await this.collection.findAll();

            const result = await this.collection.destroy({ truncate: true });

            if (typeof process.env.TENANCY_AUDIT_LOG !== 'undefined' && process.env.TENANCY_AUDIT_LOG.toLowerCase() === 'true') {
                await this.auditLog('[]', 'Truncate', oldvalue);
            }

            return result;
        } catch (e) {
            throw new RepositoryError('DB', 'Failed truncating records from the table', e);
        }
    }

    /**
     * update the database with the values of the object passed in
     * 
     * @param Object key
     * @param Object dataObject
     * @returns Promise<Array<affectedCount>>
     */
    async update(key, dataObject) {
        try {
            const oldvalue = await this.collection.findOne({
                where: key
            });

            const result = await this.collection.update(dataObject, {
                where: key
            });

            if (typeof process.env.TENANCY_AUDIT_LOG !== 'undefined' && process.env.TENANCY_AUDIT_LOG.toLowerCase() === 'true') {
                await this.auditLog(dataObject, 'Update', {
                    oldvalue: oldvalue,
                    key: key
                });
            }
            return result;
        } catch (e) {
            throw new RepositoryError('DB', `Failed updated record to ${JSON.stringify(dataObject)}`, e);
        }
    }

    /**
     * finds all records in the database
     *
     * @returns Promise<Array<Model>>
     */
    async getAll() {
        try {
            return await this.collection.findAll();
        } catch (e) {
            throw new RepositoryError('DB', 'Failed retrieving all records from the database', e);
        }
    }

    /**
     * finds a record in the database by its Primary Key
     *
     * @param Integer PK
     * @returns Promise<Model>
     */
    async findById(pk) {
        try {
            const result = await this.collection.findByPk(pk);
            return result.dataValues;
        } catch (e) {
            throw new RepositoryError('DB', `Failed retrieving record from the database for Primary Key ${pk}`, e);
        }
    }

    /**
     * finds all records matching criterias in the database
     *
     * @param Object keyValue
     * @returns Promise<Array<Model>>
     */
    async findAll(keyValue) {
        try {
            return await this.collection.findAll({
                where: keyValue
            });
        } catch (e) {
            throw new RepositoryError('DB', `Failed retrieving records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    }

    /**
     * finds a record in the database using a keyvalue Object
     *
     * @param Object keyValue
     * @returns Promise<Model>
     */
    async findOne(keyValue) {
        try {
            const result = await this.collection.findOne({
                where: keyValue
            });
            return result.dataValues;
        } catch (e) {
            throw new RepositoryError('DB', `Failed retrieving record from the database for ${JSON.stringify(keyValue)}`, e);
        }
    }

    /**
     * execute a raw sql query against the database
     *
     * @param String sqlCommand
     * @returns Promise<Array<<Model>>
     */
    async execute(sqlCommand) {
        try {
            return await this.sequelize.query(sqlCommand);
        } catch (e) {
            throw new RepositoryError('DB', `Failed executing command ${sqlCommand}`, e);
        }
    }

    /**
     * closes all active connections to the DB.
     *
     */
    async closeAllConnections() {
        // Close all sequelize Connections to the Database.
        await this.db.sequelize.close();
        console.log('All sequelize Connections to the Database were shut down gracefully.');

        // Attempt tp shut down all connections.
        try {
            await this.db.sequelize.authenticate();
            console.log('Connection has been established successfully.');
        } catch (e) {
            console.error('Unable to connect to the database. It is currently offline.');
        }
    }
}

module.exports = {
    TenantRepository,
    RepositoryError
};