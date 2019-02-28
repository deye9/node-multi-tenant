'use strict';

// Dependencies
require('dotenv').config();
const autoBind = require('auto-bind'),
    Sequelize = require('sequelize'),
    {
        files: fileReader
    } = require('../lib/fileHandler'),
    Op = Sequelize.Op;

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
     * @memberof RepositoryError
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
     * @memberof TenantRepository
     */
    constructor(model) {
        return (async () => {
            this.db = null;
            this.sequelize = null;
            this.availabledbs = null;
            this.currentDb = 'default';
            this.fileContent = fileReader.readconfig();
            this.sharedModels = this.fileContent['models-shared'];
            this.modelsFolder = this.fileContent.datastore.modelsfolder;
            this.model = typeof model === "undefined" ? 'hostname' : model;
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
     * @memberof TenantRepository
     */
    async attachDbContext(modelsPath, connectionString, connectionID) {
        // define the handler.
        let defaultCon = {};

        // setup a new Sequekize connection and disable logging.
        let sequelize = new Sequelize(connectionString, {
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
    }

    /**
     * initialize variables down
     *
     * @memberof TenantRepository
     */
    async init() {
        this.db = fileReader.requireFile(this.fileContent.datastore.dbconfigfile);

        // Get all available DB ID's on the DB server instance.
        await this.db.sequelize.query('select uuid from hostnames', { type: Sequelize.QueryTypes.SELECT })
            .then((result) => {
                this.availabledbs = result;
            });

        let connectionString = `${process.env.DB_TYPE}://${this.db.sequelize.options.username}:${this.db.sequelize.options.password}@${this.db.sequelize.options.host}:${this.db.sequelize.options.port}/${this.db.sequelize.options.database}`;
        await this.attachDbContext(this.sharedModels, connectionString, 'default');

        // Get the ID's of the respective Databases.
        this.availabledbs.forEach(async (element, id) => {
            const dbID = element.uuid;
            const _db = this.db['default'].sequelize.config;
            const filenames = await fileReader.getModelFiles(this.modelsFolder, this.sharedModels);
            connectionString = `${process.env.DB_TYPE}://${_db.username}:${_db.password}@${_db.host}:${_db.port}/${dbID}`;
            await this.attachDbContext(filenames, connectionString, dbID);
        });
    }

    /**
     * adds the new connection to the db pool.
     *
     * @memberof TenantRepository
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
     * @memberof TenantRepository
     */
    async currentDB(data) {
        if (typeof data === "undefined") {
            return;
        }

        let domain = data,
            subDomain = domain.split('.');

        if (subDomain.length > 2) {
            subDomain = subDomain[0].split("-").join(" ");
        } else {
            subDomain = subDomain[0];
        }

        if (domain.startsWith('/')) {
            domain = requestUrl.substring(1, domain.length);
        }

        if ((domain.toLowerCase() === process.env.TENANCY_DEFAULT_HOSTNAME.toLowerCase())) {
            this.currentDb = 'default';
        } else {
            await this.db['default'].sequelize.query(`select uuid from hostnames where fqdn = '${domain}'`)
                .then((result) => {
                    this.currentDb = result[0][0].uuid;
                });
        }

        return await this.db[this.currentDb].sequelize;
    }

    /**
     * creates a record in the specified database.
     * 
     * @param Object entity JSON data for creating the collection object
     * @memberof TenantRepository
     * @return Promise<Model>
     */
    async add(entity) {
        try {
            const result = await this.collection.create(entity);
            return result.dataValues;
        } catch (e) {
            return new RepositoryError('DB', 'Add entity to collection failed', e);
        }
    };

    /**
     * removes all occurrence of a record from the database.
     * 
     * @param Object keyValue
     * @memberof TenantRepository
     * @returns Promise<Integer>
     */
    async remove(keyValue) {
        try {
            return await this.collection.destroy({
                where: keyValue
            });
        } catch (e) {
            return new RepositoryError('DB', `Failed removing records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    }

    /**
     * update the database with the values of the object passed in
     * 
     * @param Object dataObject
     * @param Object conditions
     * @returns Promise<Integer>
     * @memberof TenantRepository
     */
    async update(dataObject, conditions) {
        try {
            return await this.collection.update(dataObject, {
                where: conditions
            });
        } catch (e) {
            return new RepositoryError('DB', `Failed updated record to ${JSON.stringify(keyValue)}`, e);
        }
    }

    /**
     * finds all records in the database
     *
     * @memberof TenantRepository
     * @returns Promise<Array<Model>>
     */
    async getAll() {
        try {
            return await this.collection.findAll();
        } catch (e) {
            return new RepositoryError('DB', 'Failed retrieving all records from the database', e);
        }
    };

    /**
     * finds a record in the database by its Primary Key
     *
     * @param Integer PK
     * @memberof TenantRepository
     * @returns Promise<Model>
     */
    async findById(pk) {
        try {
            const result = await this.collection.findByPk(pk);
            return result.dataValues;
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving record from the database for Primary Key ${pk}`, e);
        }
    };
    
    /**
     * finds all records matching criterias in the database
     *
     * @param Object keyValue
     * @memberof TenantRepository
     * @returns Promise<Array<Model>>
     */
    async findAll(keyValue) {
        try {
            return await this.collection.findAll({
                where: keyValue
            });
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    };

    /**
     * finds a record in the database using a keyvalue Object
     *
     * @param Object keyValue
     * @memberof TenantRepository
     * @returns Promise<Model>
     */
    async findOne(keyValue) {
        try {
            const result = await this.collection.findOne({
                where: keyValue
            });
            return result.dataValues;
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving record from the database for ${JSON.stringify(keyValue)}`, e);
        }
    };



    /**
     * truncates collection
     */
    clear(cb) {
        this.collection.truncate().then(() => {
            if (cb) {
                cb(null, true);
            }
        }, err => cb && cb(err));
    }

    /**
     * close db connection
     * @returns {void}
     */
    disconnect() {
        this.sequelize.close();
    }

    /**
     * closes all active connections to the DB.
     *
     * @memberof TenantRepository
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
    };








    /**
     * execute a raw sql query against the database
     *
     * @param String sqlCommand
     * @memberof TenantRepository
     * @returns Promise<Array<<Model>>
     */
    async execute(sqlCommand) {
        try {
            return await this.sequelize.query(sqlCommand);
        } catch (e) {
            return new RepositoryError('DB', `Failed executing command ${sqlCommand}`, e);
        }
    };
}

module.exports = {
    TenantRepository,
    RepositoryError
};