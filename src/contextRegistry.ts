import path from "path";
import Sequelize = require("sequelize");
import { ConfigLoader } from "./config";
import { buildConnectionString } from "./connectionString";
import { DbContext, TenancyConfig, TenantRecord } from "./types";

const SequelizeConstructor: any = Sequelize;

export class TenantContextRegistry {
  private readonly contexts = new Map<string, DbContext>();
  private readonly hostnames = new Map<string, string>();

  constructor(
    private readonly config: TenancyConfig,
    private readonly configLoader: ConfigLoader,
    private readonly cwd: string = process.cwd(),
    private readonly createSequelize: (
      connectionString: string,
      options: Sequelize.Options,
    ) => Sequelize.Sequelize = (connectionString, options) =>
      new SequelizeConstructor(connectionString, options),
  ) {}

  get defaultContext(): DbContext {
    return this.getContext("default");
  }

  getContext(connectionId: string): DbContext {
    const context = this.contexts.get(connectionId);
    if (!context) {
      throw new Error(
        `Tenant database context '${connectionId}' has not been initialized`,
      );
    }
    return context;
  }

  async initialize(): Promise<void> {
    const db = this.configLoader.requireFromProject<DbContext>(
      this.config.datastore.dbconfigfile,
    );
    await this.attachContext(
      this.config["models-shared"],
      buildConnectionString(db.sequelize),
      "default",
    );

    const tenants = (await this.defaultContext.sequelize.query(
      "select uuid, fqdn from hostnames",
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    )) as TenantRecord[];

    await Promise.all(
      tenants.map(async (tenant) => {
        if (tenant.fqdn) {
          this.hostnames.set(tenant.fqdn.toLowerCase(), tenant.uuid);
        }
        await this.attachTenantContext(tenant.uuid);
      }),
    );
  }

  async attachTenantContext(uuid: string): Promise<void> {
    const defaultSequelize = this.defaultContext.sequelize;
    const tenantModelFiles = await this.configLoader.getTenantModelFiles(
      this.config.datastore.modelsfolder,
      this.config["models-shared"],
    );

    await this.attachContext(
      tenantModelFiles,
      buildConnectionString(defaultSequelize, uuid),
      uuid,
    );
  }

  rememberHostname(fqdn: string, uuid: string): void {
    this.hostnames.set(fqdn.toLowerCase(), uuid);
  }

  forgetHostname(fqdn: string): void {
    this.hostnames.delete(fqdn.toLowerCase());
  }

  resolveCachedHostname(fqdn: string): string | undefined {
    return this.hostnames.get(fqdn.toLowerCase());
  }

  async resolveHostname(fqdn: string): Promise<string | undefined> {
    const cached = this.resolveCachedHostname(fqdn);
    if (cached) {
      return cached;
    }

    const rows = (await this.defaultContext.sequelize.query(
      "select uuid from hostnames where fqdn = ?",
      {
        replacements: [fqdn],
        type: Sequelize.QueryTypes.SELECT,
      },
    )) as TenantRecord[];

    const uuid = rows[0] && rows[0].uuid;
    if (uuid) {
      this.rememberHostname(fqdn, uuid);
    }
    return uuid;
  }

  async closeAndRemove(connectionId: string): Promise<void> {
    const context = this.contexts.get(connectionId);
    if (!context) {
      return;
    }

    await context.sequelize.close();
    this.contexts.delete(connectionId);
  }

  private async attachContext(
    models: Record<string, string> | string[],
    connectionString: string,
    connectionId: string,
  ): Promise<void> {
    const sequelize = this.createSequelize(connectionString, {
      logging: false,
    }) as Sequelize.Sequelize;
    const context: DbContext = { sequelize, Sequelize };
    const modelFiles = Array.isArray(models) ? models : Object.values(models);

    modelFiles.forEach((filename) => {
      const modelPath = path.resolve(
        this.cwd,
        this.config.datastore.modelsfolder,
        filename,
      );
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
