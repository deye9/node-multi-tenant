'use strict';

const autoBind = require('auto-bind');

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
    constructor(sequelize, modelType) {
        this.sequelize = sequelize;
        if (modelType === undefined) {
            throw new Error('Repository model type cannot be null.');
        }
        this.collection = sequelize.model(modelType);

        autoBind(this);
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
     * finds all records in the database
     *
     * @memberof TenantRepository
     * @returns {Promise<Array<Model>>}
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
     * @param {Object} entity JSON data for creating the collection object
     * @memberof TenantRepository
     * @return {Promise<collection>}
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
     * @param {Integer} PK
     * @memberof TenantRepository
     * @returns {Promise<Model>}
     */
    async findById(pk) {
        try {
            return await this.collection.findById(pk);
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving record from the database for Primary Key ${pk}`, e);
        }
    };

    /**
     * finds all records matching criterias in the database
     *
     * @param {Object} keyValue
     * @memberof TenantRepository
     * @returns {Promise<Array<Model>>}
     */
    async findAll(keyValue) {
        try {
            return await this.collection.findAll({where: keyValue});
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    };

    /**
     * finds a record in the database using a keyvalue Object
     *
     * @param {Object} keyValue
     * @memberof TenantRepository
     * @returns {Promise<Model>}
     */
    async findOne(keyValue) {
        try {
            return await this.collection.findOne({where: keyValue});
        } catch (e) {
            return new RepositoryError('DB', `Failed retrieving record from the database for ${JSON.stringify(keyValue)}`, e);
        }
    };

    /**
     * execute a raw sql query against the database
     *
     * @param {String} sqlCommand
     * @memberof TenantRepository
     * @returns {Promise<Array<<Model>>}
     */
    async execute(sqlCommand) {
        try {
            return await global.db.sequelize.query(sqlCommand);
        } catch (e) {
            return new RepositoryError('DB', `Failed executing command ${sqlCommand}`, e);
        }
    };

    /**
     * update the database with the values of the object passed in
     * 
     * @param {Object} dataObject
     * @param {Object} conditions
     * @returns
     * @memberof TenantRepository
     */
    async update(dataObject, conditions) {
        try {
            return await this.collection.update(dataObject, {where: conditions});
        } catch (e) {
            return new RepositoryError('DB', `Failed updated record to ${JSON.stringify(keyValue)}`, e);
        }
    }

    /**
     * removes all occurrence of a record from the database.
     * 
     * @param {Object} keyValue
     * @memberof TenantRepository
     * @returns {Promise<Integer>}
     */
    async remove(keyValue) {
        try {
            const self = this;
            return await self.collection.destroy({where: keyValue});
        } catch (e) {
            return new RepositoryError('DB', `Failed removing records from the database for ${JSON.stringify(keyValue)}`, e);
        }
    }

}

module.exports = {TenantRepository,RepositoryError};