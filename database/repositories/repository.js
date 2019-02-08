'use strict';

const autoBind = require('auto-bind');

/**
 * Handles all related errors centrally for the application.
 *
 * @class PostgreRepositoryError
 * @extends {Error}
 */
class PostgreRepositoryError extends Error {
    /**
     * Creates an instance of PostgreRepositoryError.
     * Access the previous error message via this.previous.message
     * @param {string} category
     * @param {string} message
     * @param {Object} [previous=null]
     * @memberof PostgreRepositoryError
     */
    constructor(category, title, previous = null) {
        super(title);
        this.category = category;
        this.previous = previous;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, PostgreRepositoryError);
        return {'Error Category': this.category, 'Error Title': title, 'Error Message': this.previous.message};
    }
}

class PostgreRepository {

    /**
     * Creates an instance of PostgreRepository.
     * @param {*} sequelize
     * @param {String} modelType
     * @memberof PostgreRepository
     */
    constructor(sequelize, modelType) {
        this.sequelize = sequelize;
        if (!modelType) {
            throw new PostgreRepositoryError('Postgres model type cannot be null.');
        }
        this.collection = sequelize.model(modelType);
        autoBind(this);
    }

    /**
     * truncates collection
     * @param {*} cb
     * @memberof PostgreRepository
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
     * @memberof PostgreRepository
     */
    disconnect() {
        this.sequelize.close();
    }

    /**
     * /get
     * @param {*} cb
     * @memberof PostgreRepository
     * @return {Promise<collection[]>}
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
     * @param {integer} id
     * @memberof PostgreRepository
     * @return {Promise<collection>}
     */
    findOne(id) {
        return this.collection.findById(id, {raw: data});

        // this.collection.findById(id, {
        //     raw: true
        // }).then(data => {
        //     cb(null, data);
        // }, err => cb(err));
    }

    /**
     * creates
     * @param {JSON Object} entity JSON data for creating the collection object
     * @memberof PostgreRepository
     * @return {Promise<collection>}
     */
    async add(entity) {
       try {
           const entityAdded = await this.collection.create(entity);
           return entityAdded;
        } catch (e) {
            return new PostgreRepositoryError('DB', 'Added entity to collection failed', e);
       }
    };

    /**
     * update
     * @param {*} entity
     * @param {*} cb
     * @memberof PostgreRepository
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
     * @param {*} id
     * @param {*} cb
     * @memberof PostgreRepository
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

module.exports = PostgreRepository;