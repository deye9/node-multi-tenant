import { RepositoryError } from "./errors";
import { TenantContextRegistry } from "./contextRegistry";
import { Dictionary } from "./types";

export class TenantRepository {
  constructor(
    private readonly registry: TenantContextRegistry,
    private readonly currentTenant: () => string,
  ) {}

  async add(
    modelName: string,
    entity: Dictionary | Dictionary[],
  ): Promise<any> {
    return this.capture("Add entity to main collection failed", async () => {
      const collection = this.collection(modelName);
      const result = Array.isArray(entity)
        ? await collection.bulkCreate(entity, { returning: true })
        : await collection.create(entity);

      await this.audit(modelName, "Create", result, entity);
      return result;
    });
  }

  async remove(modelName: string, keyValue: Dictionary): Promise<number> {
    return this.capture(
      `Failed removing records from the database for ${JSON.stringify(keyValue)}`,
      async () => {
        const collection = this.collection(modelName);
        const oldValue = await collection.findOne({ where: keyValue });
        const result = await collection.destroy({ where: keyValue });
        await this.audit(modelName, "Remove", keyValue, oldValue);
        return result;
      },
    );
  }

  async truncate(modelName: string): Promise<number> {
    return this.capture(
      "Failed truncating records from the table",
      async () => {
        const collection = this.collection(modelName);
        const oldValue = await collection.findAll();
        const result = await collection.destroy({ truncate: true });
        await this.audit(modelName, "Truncate", [], oldValue);
        return result;
      },
    );
  }

  async update(
    modelName: string,
    key: Dictionary,
    dataObject: Dictionary,
  ): Promise<any> {
    return this.capture(
      `Failed updated record to ${JSON.stringify(dataObject)}`,
      async () => {
        const collection = this.collection(modelName);
        const oldValue = await collection.findOne({ where: key });
        const result = await collection.update(dataObject, { where: key });
        await this.audit(modelName, "Update", dataObject, {
          oldvalue: oldValue,
          key,
        });
        return result;
      },
    );
  }

  async getAll(modelName: string): Promise<any[]> {
    return this.capture("Failed retrieving all records from the database", () =>
      this.collection(modelName).findAll(),
    );
  }

  async findById(modelName: string, pk: number): Promise<Dictionary> {
    return this.capture(
      `Failed retrieving record from the database for Primary Key ${pk}`,
      async () => {
        const result = await this.collection(modelName).findByPk(pk);
        return result.dataValues;
      },
    );
  }

  async findAll(modelName: string, keyValue?: Dictionary): Promise<any[]> {
    if (typeof keyValue === "undefined") {
      return this.getAll(modelName);
    }

    return this.capture(
      `Failed retrieving records from the database for ${JSON.stringify(keyValue)}`,
      () => this.collection(modelName).findAll({ where: keyValue }),
    );
  }

  async findOne(modelName: string, keyValue: Dictionary): Promise<Dictionary> {
    return this.capture(
      `Failed retrieving record from the database for ${JSON.stringify(keyValue)}`,
      async () => {
        const result = await this.collection(modelName).findOne({
          where: keyValue,
        });
        return result.dataValues;
      },
    );
  }

  async execute(sqlCommand: string): Promise<any[]> {
    return this.capture(`Failed executing command ${sqlCommand}`, () =>
      this.registry
        .getContext(this.currentTenant())
        .sequelize.query(sqlCommand),
    );
  }

  private collection(modelName: string): any {
    return this.registry
      .getContext(this.currentTenant())
      .sequelize.model(modelName);
  }

  private async audit(
    modelName: string,
    action: string,
    entity: any,
    oldValue: any,
  ): Promise<void> {
    if (
      process.env.TENANCY_AUDIT_LOG?.toLowerCase() !== "true" ||
      this.currentTenant() === "default"
    ) {
      return;
    }

    const auditCollection = this.registry
      .getContext(this.currentTenant())
      .sequelize.model("audits");
    const records = Array.isArray(entity) ? entity : [entity];

    if (action === "Truncate") {
      await Promise.all(
        (oldValue || []).map((record: any) =>
          auditCollection.create({
            event: action,
            model: modelName,
            record_id: record.dataValues.id,
            old_values: "[]",
            new_values: JSON.stringify(record.dataValues),
          }),
        ),
      );
      return;
    }

    await Promise.all(
      records.map((record: any) =>
        auditCollection.create({
          event: action,
          model: modelName,
          record_id:
            action === "Remove"
              ? Object.values(entity)[0]
              : record.dataValues
                ? record.dataValues.id
                : Object.values(oldValue.key)[0],
          old_values: JSON.stringify(
            action === "Update" ? oldValue.oldvalue : oldValue,
          ),
          new_values: JSON.stringify(
            action === "Remove" ? [] : record.dataValues || record,
          ),
        }),
      ),
    );
  }

  private async capture<T>(
    title: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw new RepositoryError("DB", title, error as Error);
    }
  }
}
