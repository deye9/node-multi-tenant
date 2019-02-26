'use strict';

// Dependencies
require('dotenv').config();
const autoBind = require('auto-bind'),
    Sequelize = require('sequelize'),
    {
        files: fileReader
    } = require('../lib/fileHandler');

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
    constructor(modelType) {
        return (async () => {
            this.db = null;
            this.sequelize = null;
            this.availabledbs = null;

            // All async code here
            this.value = await this.init();

            return this;
        })();

        //NO DO NOT DO ANYTHING PROMISE RELATED HERE
        // AFTER doing `new ....` you can then proceeed to do call all
        // of this. You should abstract all of this into a separate method

        // How sir
        // const mk = (async () => {
        //     // All async code here
        //     await this.init();

        //     return this;
        // })();

        // console.log('CLI is', mk);

        // return mk;
        // this.connectionResolver()
        //     .then((connectionString) => {
        //         // const fileContent = fileReader.readconfig(),
        //         // db = fileReader.requireFile(fileContent.datastore.dbconfigfile);
        //         console.log(db.sequelize.options);

        //         // Destroy all previous connections to the DB.
        //         // Get all available DB on the DB server instance.
        //         // Create new connections to the DB.

        // console.log('------------->', connectionString);
        //         this.sequelize = db.sequelize;
        //         this.connectionString = '';

        //         if (modelType === undefined) {
        //             throw new Error('Repository model type cannot be null.');
        //         }

        //         this.collection = this.sequelize.model(modelType);

        //         autoBind(this);
        // });

        // const fileContent = fileReader.readconfig(),
        //     db = fileReader.requireFile(fileContent.datastore.dbconfigfile);

        // console.log('Default ModelType is', modelType);
        // if (Object.keys(this.db).length === 5) {
        //     this.resetDB();
        // }

        // this.db = db;
        // this.sequelize = db.sequelize;

        // if (modelType === undefined) {
        //     throw new Error('Repository model type cannot be null.');
        // }

        // this.collection = this.sequelize.model(modelType);

        // // this.db.forEach((element, index, id) => {
        // //     console.log(element, index, id);
        // // });

        // // ['init', 'hostname', 'Users', 'sequelize', 'Sequelize'];

        // autoBind(this);
    }

    async init() {
        const fileContent = fileReader.readconfig();
        const sharedModels = fileContent['models-shared'];
        const modelsFolder = fileContent.datastore.modelsfolder;
        this.db = fileReader.requireFile(fileContent.datastore.dbconfigfile);

        // Get all available DB ID's on the DB server instance.
        this.availabledbs = await this.db.sequelize.query('select uuid from hostnames');

        // Close all open connections.
        await this.closeAllConnections();

        // Define the handler
        let defaultCon = {};

        let sequelize = new Sequelize(`${process.env.DB_TYPE}://${this.db.sequelize.options.username}:${this.db.sequelize.options.password}@${this.db.sequelize.options.host}:${this.db.sequelize.options.port}/${this.db.sequelize.options.database}`);

        // Add the default Db Connection here
        Object.values(sharedModels).map((filename) => {
            const modelName = filename.replace(/.js/gi, '');
            const model = sequelize['import'](process.env.PWD + '/' + fileContent.datastore.modelsfolder + '/' + filename);
            defaultCon[modelName] = model;
            if (defaultCon[modelName].associate) {
                defaultCon[modelName].associate(defaultCon);
            }
        });

        defaultCon.sequelize = sequelize;
        defaultCon.Sequelize = Sequelize;
        this.db['default'] = defaultCon;

        // Get the ID's of the respective Databases.
        this.availabledbs.forEach(async (element, index, id) => {
            defaultCon = {};
            const dbID = id[0][index].uuid;
            const _db = this.db['default'].sequelize.config;            
            const filenames = await fileReader.getModelFiles(modelsFolder, sharedModels);
            sequelize = new Sequelize(`${process.env.DB_TYPE}://${_db.username}:${_db.password}@${_db.host}:${_db.port}/${dbID}`);

            Object.values(filenames).map((filename) => {
                const modelName = filename.replace(/.js/gi, '');
                // defaultCon[modelName] = process.env.PWD + '/' + fileContent.datastore.modelsfolder + '/' + filename;
                const model = sequelize['import'](process.env.PWD + '/' + fileContent.datastore.modelsfolder + '/' + filename);
                defaultCon[modelName] = model;
                if (defaultCon[modelName].associate) {
                    defaultCon[modelName].associate(defaultCon);
                }
            });

            defaultCon.sequelize = sequelize;
            defaultCon.Sequelize = Sequelize;
    
            this.db[dbID] = defaultCon;
        });

        // Perform the default binding
        this.sequelize = this.db['default'].sequelize;
        this.collection = this.db['default'].sequelize.model('hostname');
        autoBind(this);
    } 

    /**
     * resolves the connection and returns the connection string to be used.
     *
     * @param {Sequelize Database} db
     * @returns String
     * @memberof TenantRepository
     */
    async connectionResolver(db) {
        // Subscribe to requestUrl event which is being emitted as a Global Event.
        return await new Promise((resolve, reject) => {
            em.on('requestUrl', async (data) => {
                let requestUrl = data,
                    domain = requestUrl,
                    subDomain = domain.split('.');

                try {
                    if (subDomain.length > 2) {
                        subDomain = subDomain[0].split("-").join(" ");
                    } else {
                        subDomain = subDomain[0];
                    }

                    if (requestUrl.startsWith('/')) {
                        requestUrl = requestUrl.substring(1, requestUrl.length);
                    }

                    // Write back the tenant connection string
                    if ((domain.toLowerCase() === process.env.TENANCY_DEFAULT_HOSTNAME.toLowerCase()) || domain.toLowerCase() === 'default') {
                        return resolve(`${db.sequelize.options.dialect}://${db.sequelize.options.username}:${db.sequelize.options.password}@${db.sequelize.options.host}:${db.sequelize.options.port}/${db.sequelize.options.database}`);
                    } else {
                        db.sequelize.query(`select uuid from hostnames where fqdn = '${domain}'`)
                            .then((result) => {
                                return resolve(`${db.sequelize.options.dialect}://${db.sequelize.options.username}:${db.sequelize.options.password}@${db.sequelize.options.host}:${db.sequelize.options.port}/${result[0][0].uuid}`);
                            });
                    }
                } catch (e) {
                    return reject('DB', `Unable to retrieve UUID detail for Tenant "${domain}"`, e);
                }
            });
        })
    }

    /**
     * closes all previous connections to the DB
     * and creates a new connection with all registered
     * db instances returned as part of the new connection.
     *
     * @memberof TenantRepository
     * @returns Promise<void>
     */
    async resetDB(uuid) {
        const _db = this.db['default'].config;
        this.db[uuid] = new Sequelize(`${process.env.DB_TYPE}://${_db.username}:${_db.password}@${_db.host}:${_db.port}/${uuid}`);            return;
        return;
    }

    /**
     * gets the current db to be used by the connection.
     *
     * @returns Promise<Database>
     * @memberof TenantRepository
     */
    async currentDB() {
        console.log('AM', this.db['default'].sequelize.config);
        return this.db['default'];
    }

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
     * finds all records in the database
     *
     * @memberof TenantRepository
     * @returns Promise<Array<Model>>
     */
    async findAll() {
        try {
            return await this.collection.all();
        } catch (e) {
            return new RepositoryError('DB', 'Failed retrieving all records from the database', e);
        }
    };

    /**
     * creates a record in the specified database.
     * 
     * @param Object entity JSON data for creating the collection object
     * @memberof TenantRepository
     * @return Promise<collection>
     */
    async add(entity) {
        try {
            return await this.collection.create(entity);
        } catch (e) {
            return new RepositoryError('DB', 'Add entity to collection failed', e);
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
            return await this.collection.findByPk(pk);
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
            return await this.collection.findOne({
                where: keyValue
            });
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving record from the database for ${JSON.stringify(keyValue)}`, e);
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

    /**
     * update the database with the values of the object passed in
     * 
     * @param Object dataObject
     * @param Object conditions
     * @returns
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
     * removes all occurrence of a record from the database.
     * 
     * @param Object keyValue
     * @memberof TenantRepository
     * @returns Promise<Integer>
     */
    async remove(keyValue) {
        try {
            const self = this;
            return await self.collection.destroy({
                where: keyValue
            });
        } catch (e) {
            return new RepositoryError('DB', `Failed removing records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    }
}

module.exports = {
    TenantRepository,
    RepositoryError
};