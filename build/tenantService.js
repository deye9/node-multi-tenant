"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const events_1 = require("events");
const path = require("path");
const config_1 = require("./config");
const connectionString_1 = require("./connectionString");
const contextRegistry_1 = require("./contextRegistry");
const repository_1 = require("./repository");
const cli_1 = require("./cli");
class TenantService {
    constructor(options = {}) {
        this.currentTenantId = "default";
        this.initialized = false;
        this.cwd = options.cwd || process.cwd();
        this.eventEmitter = options.eventEmitter || global.em || new events_1.EventEmitter();
        global.em = this.eventEmitter;
        this.configLoader = new config_1.ConfigLoader(this.cwd);
        this.config = this.configLoader.readConfig(options.config);
        this.registry = new contextRegistry_1.TenantContextRegistry(this.config, this.configLoader, this.cwd);
        this.repository = new repository_1.TenantRepository(this.registry, () => this.currentTenantId);
        this.cli = new cli_1.TenancyCli(this.config, this.cwd);
        if (options.startCli) {
            this.cli.startInteractive();
        }
    }
    async init() {
        if (this.initialized) {
            return;
        }
        if (this.initialization) {
            return this.initialization;
        }
        this.initialization = this.initialize();
        try {
            await this.initialization;
        }
        catch (error) {
            this.initialization = undefined;
            throw error;
        }
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        await this.registry.initialize();
        this.eventEmitter.on("requestUrl", (hostname) => {
            this.setCurrentTenant(hostname).catch((error) => this.cli.logger(error.message, "\x1b[31m%s\x1b[0m"));
        });
        if (process.env.TENANCY_DEFAULT_HOSTNAME) {
            await this.setCurrentTenant(process.env.TENANCY_DEFAULT_HOSTNAME.toLowerCase());
        }
        this.initialized = true;
    }
    async setCurrentTenant(hostname) {
        var _a;
        if (!hostname) {
            return;
        }
        if (hostname.toLowerCase() ===
            ((_a = process.env.TENANCY_DEFAULT_HOSTNAME) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
            this.currentTenantId = "default";
            return;
        }
        const cached = this.registry.resolveCachedHostname(hostname);
        if (cached) {
            await this.registry.attachTenantContext(cached);
            this.currentTenantId = cached;
            return;
        }
        const uuid = await this.registry.resolveHostname(hostname);
        if (uuid) {
            await this.registry.attachTenantContext(uuid);
            this.currentTenantId = uuid;
        }
    }
    async createTenant(fqdn) {
        await this.ensureInitialized();
        const previousTenantId = this.currentTenantId;
        this.currentTenantId = "default";
        let result;
        try {
            result = await this.repository.add("hostname", {
                fqdn,
                force_https: true,
            });
        }
        finally {
            this.currentTenantId = previousTenantId;
        }
        await this.createTenantDatabase(result.uuid);
        this.registry.rememberHostname(fqdn, result.uuid);
        return {
            website_id: result.id,
            uuid: result.uuid,
            fqdn,
        };
    }
    async deleteTenant(fqdn) {
        await this.ensureInitialized();
        const tenant = await this.tenantDbUUID(fqdn);
        const connectionString = (0, connectionString_1.buildConnectionString)(this.registry.defaultContext.sequelize, tenant.uuid);
        this.currentTenantId = "default";
        const result = await this.repository.remove("hostname", { fqdn });
        await this.registry.closeAndRemove(tenant.uuid);
        await this.cli.executeCommand(`node_modules/.bin/sequelize db:drop --url ${connectionString}`);
        this.registry.forgetHostname(fqdn);
        this.cli.logger(`Successfully dropped database for tenant ${fqdn}`);
        return result;
    }
    async tenantExists(fqdn) {
        await this.ensureInitialized();
        const previousTenantId = this.currentTenantId;
        this.currentTenantId = "default";
        try {
            return this.repository.findOne("hostname", { fqdn });
        }
        finally {
            this.currentTenantId = previousTenantId;
        }
    }
    async updateTenant(fqdn, dataObject) {
        await this.ensureInitialized();
        const previousTenantId = this.currentTenantId;
        this.currentTenantId = "default";
        try {
            const tenantDetails = await this.tenantExists(fqdn);
            Object.keys(dataObject).forEach((key) => {
                if (!["id", "fqdn", "uuid", "createdAt", "deletedAt"].includes(key)) {
                    tenantDetails[key] = dataObject[key];
                }
            });
            return this.repository.update("hostname", { id: tenantDetails.id }, tenantDetails);
        }
        finally {
            this.currentTenantId = previousTenantId;
        }
    }
    async getTenantConnectionString() {
        await this.ensureInitialized();
        return (0, connectionString_1.buildConnectionString)(this.registry.getContext(this.currentTenantId).sequelize);
    }
    async truncate(modelName) {
        await this.ensureInitialized();
        return this.repository.truncate(modelName);
    }
    async delete(modelName, key) {
        await this.ensureInitialized();
        return this.repository.remove(modelName, key);
    }
    async create(modelName, dataObject) {
        await this.ensureInitialized();
        return this.repository.add(modelName, dataObject);
    }
    async update(modelName, key, dataObject) {
        await this.ensureInitialized();
        await this.repository.update(modelName, key, dataObject);
        return { key, dataObject };
    }
    async findById(modelName, id) {
        await this.ensureInitialized();
        return this.repository.findById(modelName, id);
    }
    async findFirst(modelName, key) {
        await this.ensureInitialized();
        return this.repository.findOne(modelName, key);
    }
    async findAll(modelName, key) {
        await this.ensureInitialized();
        return this.repository.findAll(modelName, key);
    }
    async executeQuery(sqlCommand) {
        await this.ensureInitialized();
        return this.repository.execute(sqlCommand);
    }
    async tenantDbUUID(fqdn) {
        const previousTenantId = this.currentTenantId;
        this.currentTenantId = "default";
        try {
            return (await this.repository.findOne("hostname", {
                fqdn,
            }));
        }
        finally {
            this.currentTenantId = previousTenantId;
        }
    }
    async createTenantDatabase(uuid) {
        const defaultSequelize = this.registry.defaultContext.sequelize;
        const connectionString = (0, connectionString_1.buildConnectionString)(defaultSequelize, uuid);
        const migrationPath = path.resolve(this.cwd, this.config.datastore.migrationsfolder);
        const seedersPath = path.resolve(this.cwd, this.config.datastore.seedersfolder);
        await this.cli.executeCommand(`node_modules/.bin/sequelize db:create --url ${connectionString}`);
        this.cli.logger("Performing Migrations");
        await this.cli.executeCommand(`node_modules/.bin/sequelize db:migrate --url ${connectionString} --migrations-path=${migrationPath}/tenants`);
        this.cli.logger("Seeding all database");
        await this.cli.executeCommand(`node_modules/.bin/sequelize db:seed:all --url ${connectionString} --seeders-path ${seedersPath}`);
        await this.registry.attachTenantContext(uuid);
    }
    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }
}
exports.TenantService = TenantService;
