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
        return {'Error Category': this.category, 'Error Title': title, 'Error Message': this.previous.message};
    }
}

class GenericRepository {
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
     * /get
     */
    findAll(cb) {
        this.collection.findAll({
            raw: true
        }).then(data => {
            cb(null, data);
        }, err => cb(err));
    }

    /**
     * get /:id
     */
    findOne(id, cb) {
        this.collection.findById(id, {
            raw: true
        }).then(data => {
            cb(null, data);
        }, err => cb(err));
    }

    /**
     * creates a record in the specified database.
     * @param {JSON Object} entity JSON data for creating the collection object
     * @memberof GenericRepository
     * @return {Promise<collection>}
     */
    async add(entity) {
       try {
           const entityAdded = await this.collection.create(entity);
           return entityAdded;
        } catch (e) {
            return new RepositoryError('DB', 'Add entity to collection failed', e);
       }
    };

    /**
     * update
     */
    update(entity, cb) {
        this.collection.update(entity, {
            where: {
                _id: entity._id
            },
            raw: true,
            returning: true
        }).then(data => {
            cb(null, data[1][0]);
        }, err => cb(err));
    }

    /**
     * delete
     */
    remove(id, cb) {
        const self = this;
        self.findOne(id, (err, data) => {
            self.collection.destroy({
                where: {
                    _id: id
                },
                raw: true
            }).then(() => {
                cb(null, data);
            }, err => cb(err));
        });
    }

}

module.exports = GenericRepository;