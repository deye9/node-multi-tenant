"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextRegistry = void 0;
const path = require("path");
const Sequelize = require("sequelize");
const connectionString_1 = require("./connectionString");
const SequelizeConstructor = Sequelize;
class TenantContextRegistry {
    constructor(config, configLoader, cwd = process.cwd(), createSequelize = (connectionString, options) => new SequelizeConstructor(connectionString, options)) {
        this.config = config;
        this.configLoader = configLoader;
        this.cwd = cwd;
        this.createSequelize = createSequelize;
        this.contexts = new Map();
        this.hostnames = new Map();
    }
    get defaultContext() {
        return this.getContext("default");
    }
    getContext(connectionId) {
        const context = this.contexts.get(connectionId);
        if (!context) {
            throw new Error(`Tenant database context '${connectionId}' has not been initialized`);
        }
        return context;
    }
    async initialize() {
        const db = this.configLoader.requireFromProject(this.config.datastore.dbconfigfile);
        await this.attachContext(this.config["models-shared"], (0, connectionString_1.buildConnectionString)(db.sequelize), "default");
        const tenants = (await this.defaultContext.sequelize.query("select uuid, fqdn from hostnames", {
            type: Sequelize.QueryTypes.SELECT,
        }));
        tenants.forEach((tenant) => {
            if (tenant.fqdn) {
                this.hostnames.set(tenant.fqdn.toLowerCase(), tenant.uuid);
            }
        });
    }
    async attachTenantContext(uuid) {
        if (this.contexts.has(uuid)) {
            return;
        }
        const defaultSequelize = this.defaultContext.sequelize;
        const tenantModelFiles = await this.configLoader.getTenantModelFiles(this.config.datastore.modelsfolder, this.config["models-shared"]);
        await this.attachContext(tenantModelFiles, (0, connectionString_1.buildConnectionString)(defaultSequelize, uuid), uuid);
    }
    rememberHostname(fqdn, uuid) {
        this.hostnames.set(fqdn.toLowerCase(), uuid);
    }
    forgetHostname(fqdn) {
        this.hostnames.delete(fqdn.toLowerCase());
    }
    resolveCachedHostname(fqdn) {
        return this.hostnames.get(fqdn.toLowerCase());
    }
    async resolveHostname(fqdn) {
        const cached = this.resolveCachedHostname(fqdn);
        if (cached) {
            return cached;
        }
        const rows = (await this.defaultContext.sequelize.query("select uuid from hostnames where fqdn = ?", {
            replacements: [fqdn],
            type: Sequelize.QueryTypes.SELECT,
        }));
        const uuid = rows[0] && rows[0].uuid;
        if (uuid) {
            this.rememberHostname(fqdn, uuid);
        }
        return uuid;
    }
    async closeAndRemove(connectionId) {
        const context = this.contexts.get(connectionId);
        if (!context) {
            return;
        }
        await context.sequelize.close();
        this.contexts.delete(connectionId);
    }
    async attachContext(models, connectionString, connectionId) {
        const sequelize = this.createSequelize(connectionString, {
            logging: false,
        });
        const context = { sequelize, Sequelize };
        const modelFiles = Array.isArray(models) ? models : Object.values(models);
        modelFiles.forEach((filename) => {
            const modelPath = path.resolve(this.cwd, this.config.datastore.modelsfolder, filename);
            const modelFactory = require(modelPath);
            const model = modelFactory(sequelize, Sequelize);
            context[model.name] = model;
        });
        Object.keys(context).forEach((modelName) => {
            const model = context[modelName];
            if (model && typeof model.associate === "function") {
                model.associate(context);
            }
        });
        this.contexts.set(connectionId, context);
    }
}
exports.TenantContextRegistry = TenantContextRegistry;
