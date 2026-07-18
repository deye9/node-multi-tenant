"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryError = exports.TenantRepository = exports.TenantService = exports.update = exports.updateTenant = exports.create = exports.getTenantConnectionString = exports.findFirst = exports.executeQuery = exports.findById = exports.delete = exports.deleteRecord = exports.truncate = exports.deleteTenant = exports.tenantExists = exports.createTenant = exports.findAll = exports.init = void 0;
const tenantService_1 = require("./tenantService");
let service;
function getService(options) {
    if (!service || options) {
        service = new tenantService_1.TenantService(options);
    }
    return service;
}
const init = (options) => getService(options).init();
exports.init = init;
const findAll = (modelName, key) => getService().findAll(modelName, key);
exports.findAll = findAll;
const createTenant = (fqdn) => getService().createTenant(fqdn);
exports.createTenant = createTenant;
const tenantExists = (fqdn) => getService().tenantExists(fqdn);
exports.tenantExists = tenantExists;
const deleteTenant = (fqdn) => getService().deleteTenant(fqdn);
exports.deleteTenant = deleteTenant;
const truncate = (modelName) => getService().truncate(modelName);
exports.truncate = truncate;
const deleteRecord = (modelName, key) => getService().delete(modelName, key);
exports.deleteRecord = deleteRecord;
exports.delete = exports.deleteRecord;
const findById = (modelName, id) => getService().findById(modelName, id);
exports.findById = findById;
const executeQuery = (sqlCommand) => getService().executeQuery(sqlCommand);
exports.executeQuery = executeQuery;
const findFirst = (modelName, key) => getService().findFirst(modelName, key);
exports.findFirst = findFirst;
const getTenantConnectionString = () => getService().getTenantConnectionString();
exports.getTenantConnectionString = getTenantConnectionString;
const create = (modelName, dataObject) => getService().create(modelName, dataObject);
exports.create = create;
const updateTenant = (fqdn, dataObject) => getService().updateTenant(fqdn, dataObject);
exports.updateTenant = updateTenant;
const update = (modelName, key, dataObject) => getService().update(modelName, key, dataObject);
exports.update = update;
var tenantService_2 = require("./tenantService");
Object.defineProperty(exports, "TenantService", { enumerable: true, get: function () { return tenantService_2.TenantService; } });
var repository_1 = require("./repository");
Object.defineProperty(exports, "TenantRepository", { enumerable: true, get: function () { return repository_1.TenantRepository; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "RepositoryError", { enumerable: true, get: function () { return errors_1.RepositoryError; } });
module.exports = {
    init: exports.init,
    findAll: exports.findAll,
    createTenant: exports.createTenant,
    tenantExists: exports.tenantExists,
    deleteTenant: exports.deleteTenant,
    truncate: exports.truncate,
    deleteRecord: exports.deleteRecord,
    delete: exports.deleteRecord,
    findById: exports.findById,
    executeQuery: exports.executeQuery,
    findFirst: exports.findFirst,
    getTenantConnectionString: exports.getTenantConnectionString,
    create: exports.create,
    updateTenant: exports.updateTenant,
    update: exports.update,
    TenantService: tenantService_1.TenantService,
    TenantRepository: require("./repository").TenantRepository,
    RepositoryError: require("./errors").RepositoryError,
};
