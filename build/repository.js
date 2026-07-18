"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepository = void 0;
const errors_1 = require("./errors");
class TenantRepository {
    constructor(registry, currentTenant) {
        this.registry = registry;
        this.currentTenant = currentTenant;
    }
    async add(modelName, entity) {
        return this.capture("Add entity to main collection failed", async () => {
            const collection = this.collection(modelName);
            const result = Array.isArray(entity)
                ? await collection.bulkCreate(entity, { returning: true })
                : await collection.create(entity);
            await this.audit(modelName, "Create", result, entity);
            return result;
        });
    }
    async remove(modelName, keyValue) {
        return this.capture(`Failed removing records from the database for ${JSON.stringify(keyValue)}`, async () => {
            const collection = this.collection(modelName);
            const oldValue = await collection.findOne({ where: keyValue });
            const result = await collection.destroy({ where: keyValue });
            await this.audit(modelName, "Remove", keyValue, oldValue);
            return result;
        });
    }
    async truncate(modelName) {
        return this.capture("Failed truncating records from the table", async () => {
            const collection = this.collection(modelName);
            const oldValue = await collection.findAll();
            const result = await collection.destroy({ truncate: true });
            await this.audit(modelName, "Truncate", [], oldValue);
            return result;
        });
    }
    async update(modelName, key, dataObject) {
        return this.capture(`Failed updated record to ${JSON.stringify(dataObject)}`, async () => {
            const collection = this.collection(modelName);
            const oldValue = await collection.findOne({ where: key });
            const result = await collection.update(dataObject, { where: key });
            await this.audit(modelName, "Update", dataObject, {
                oldvalue: oldValue,
                key,
            });
            return result;
        });
    }
    async getAll(modelName) {
        return this.capture("Failed retrieving all records from the database", () => this.collection(modelName).findAll());
    }
    async findById(modelName, pk) {
        return this.capture(`Failed retrieving record from the database for Primary Key ${pk}`, async () => {
            const result = await this.collection(modelName).findByPk(pk);
            return result === null || result === void 0 ? void 0 : result.dataValues;
        });
    }
    async findAll(modelName, keyValue) {
        if (typeof keyValue === "undefined") {
            return this.getAll(modelName);
        }
        return this.capture(`Failed retrieving records from the database for ${JSON.stringify(keyValue)}`, () => this.collection(modelName).findAll({ where: keyValue }));
    }
    async findOne(modelName, keyValue) {
        return this.capture(`Failed retrieving record from the database for ${JSON.stringify(keyValue)}`, async () => {
            const result = await this.collection(modelName).findOne({
                where: keyValue,
            });
            return result === null || result === void 0 ? void 0 : result.dataValues;
        });
    }
    async execute(sqlCommand) {
        return this.capture(`Failed executing command ${sqlCommand}`, () => this.registry
            .getContext(this.currentTenant())
            .sequelize.query(sqlCommand));
    }
    collection(modelName) {
        return this.registry
            .getContext(this.currentTenant())
            .sequelize.model(modelName);
    }
    async audit(modelName, action, entity, oldValue) {
        var _a;
        if (((_a = process.env.TENANCY_AUDIT_LOG) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "true" ||
            this.currentTenant() === "default") {
            return;
        }
        const auditCollection = this.registry
            .getContext(this.currentTenant())
            .sequelize.model("audits");
        const records = Array.isArray(entity) ? entity : [entity];
        if (action === "Truncate") {
            await Promise.all((oldValue || []).map((record) => auditCollection.create({
                event: action,
                model: modelName,
                record_id: record.dataValues.id,
                old_values: "[]",
                new_values: JSON.stringify(record.dataValues),
            })));
            return;
        }
        await Promise.all(records.map((record) => auditCollection.create({
            event: action,
            model: modelName,
            record_id: action === "Remove"
                ? Object.values(entity)[0]
                : record.dataValues
                    ? record.dataValues.id
                    : Object.values(oldValue.key)[0],
            old_values: JSON.stringify(action === "Update" ? oldValue.oldvalue : oldValue),
            new_values: JSON.stringify(action === "Remove" ? [] : record.dataValues || record),
        })));
    }
    async capture(title, operation) {
        try {
            return await operation();
        }
        catch (error) {
            throw new errors_1.RepositoryError("DB", title, error);
        }
    }
}
exports.TenantRepository = TenantRepository;
