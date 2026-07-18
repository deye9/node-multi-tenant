import { EventEmitter } from "events";
import path from "path";
import { ConfigLoader } from "./config";
import { buildConnectionString } from "./connectionString";
import { TenantContextRegistry } from "./contextRegistry";
import { TenantRepository } from "./repository";
import { TenancyCli } from "./cli";
import { Dictionary, TenancyConfig, TenantInitOptions } from "./types";

export class TenantService {
  private readonly cwd: string;
  private readonly eventEmitter: EventEmitter;
  private readonly configLoader: ConfigLoader;
  private readonly config: TenancyConfig;
  private readonly registry: TenantContextRegistry;
  private readonly repository: TenantRepository;
  private readonly cli: TenancyCli;
  private currentTenantId = "default";
  private initialized = false;

  constructor(options: TenantInitOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.eventEmitter = options.eventEmitter || global.em || new EventEmitter();
    global.em = this.eventEmitter;

    this.configLoader = new ConfigLoader(this.cwd);
    this.config = this.configLoader.readConfig(options.config);
    this.registry = new TenantContextRegistry(
      this.config,
      this.configLoader,
      this.cwd,
    );
    this.repository = new TenantRepository(
      this.registry,
      () => this.currentTenantId,
    );
    this.cli = new TenancyCli(this.config, this.cwd);

    if (options.startCli) {
      this.cli.startInteractive();
    }
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.registry.initialize();
    this.eventEmitter.on("requestUrl", (hostname: string) => {
      this.setCurrentTenant(hostname).catch((error) =>
        this.cli.logger(error.message, "\x1b[31m%s\x1b[0m"),
      );
    });

    if (process.env.TENANCY_DEFAULT_HOSTNAME) {
      await this.setCurrentTenant(
        process.env.TENANCY_DEFAULT_HOSTNAME.toLowerCase(),
      );
    }

    this.initialized = true;
  }

  async setCurrentTenant(hostname?: string): Promise<void> {
    if (!hostname) {
      return;
    }

    if (
      hostname.toLowerCase() ===
      process.env.TENANCY_DEFAULT_HOSTNAME?.toLowerCase()
    ) {
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

  async createTenant(fqdn: string): Promise<Dictionary> {
    await this.ensureInitialized();
    const previousTenantId = this.currentTenantId;
    this.currentTenantId = "default";

    let result: any;
    try {
      result = await this.repository.add("hostname", {
        fqdn,
        force_https: true,
      });
    } finally {
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

  async deleteTenant(fqdn: string): Promise<number> {
    await this.ensureInitialized();
    const tenant = await this.tenantDbUUID(fqdn);
    const connectionString = buildConnectionString(
      this.registry.defaultContext.sequelize,
      tenant.uuid,
    );

    this.currentTenantId = "default";
    const result = await this.repository.remove("hostname", { fqdn });
    await this.registry.closeAndRemove(tenant.uuid);
    await this.cli.executeCommand(
      `node_modules/.bin/sequelize db:drop --url ${connectionString}`,
    );
    this.registry.forgetHostname(fqdn);
    this.cli.logger(`Successfully dropped database for tenant ${fqdn}`);
    return result;
  }

  async tenantExists(fqdn: string): Promise<Dictionary> {
    await this.ensureInitialized();
    const previousTenantId = this.currentTenantId;
    this.currentTenantId = "default";

    try {
      return this.repository.findOne("hostname", { fqdn });
    } finally {
      this.currentTenantId = previousTenantId;
    }
  }

  async updateTenant(fqdn: string, dataObject: Dictionary): Promise<any> {
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

      return this.repository.update(
        "hostname",
        { id: tenantDetails.id },
        tenantDetails,
      );
    } finally {
      this.currentTenantId = previousTenantId;
    }
  }

  async getTenantConnectionString(): Promise<string> {
    await this.ensureInitialized();
    return buildConnectionString(
      this.registry.getContext(this.currentTenantId).sequelize,
    );
  }

  async truncate(modelName: string): Promise<number> {
    await this.ensureInitialized();
    return this.repository.truncate(modelName);
  }

  async delete(modelName: string, key: Dictionary): Promise<number> {
    await this.ensureInitialized();
    return this.repository.remove(modelName, key);
  }

  async create(
    modelName: string,
    dataObject: Dictionary | Dictionary[],
  ): Promise<any> {
    await this.ensureInitialized();
    return this.repository.add(modelName, dataObject);
  }

  async update(
    modelName: string,
    key: Dictionary,
    dataObject: Dictionary,
  ): Promise<Dictionary> {
    await this.ensureInitialized();
    await this.repository.update(modelName, key, dataObject);
    return { key, dataObject };
  }

  async findById(modelName: string, id: number): Promise<Dictionary> {
    await this.ensureInitialized();
    return this.repository.findById(modelName, id);
  }

  async findFirst(modelName: string, key: Dictionary): Promise<Dictionary> {
    await this.ensureInitialized();
    return this.repository.findOne(modelName, key);
  }

  async findAll(modelName: string, key?: Dictionary): Promise<any[]> {
    await this.ensureInitialized();
    return this.repository.findAll(modelName, key);
  }

  async executeQuery(sqlCommand: string): Promise<any[]> {
    await this.ensureInitialized();
    return this.repository.execute(sqlCommand);
  }

  private async tenantDbUUID(
    fqdn: string,
  ): Promise<Dictionary & { uuid: string }> {
    const previousTenantId = this.currentTenantId;
    this.currentTenantId = "default";
    try {
      return (await this.repository.findOne("hostname", {
        fqdn,
      })) as Dictionary & { uuid: string };
    } finally {
      this.currentTenantId = previousTenantId;
    }
  }

  private async createTenantDatabase(uuid: string): Promise<void> {
    const defaultSequelize = this.registry.defaultContext.sequelize;
    const connectionString = buildConnectionString(defaultSequelize, uuid);
    const migrationPath = path.resolve(
      this.cwd,
      this.config.datastore.migrationsfolder,
    );
    const seedersPath = path.resolve(
      this.cwd,
      this.config.datastore.seedersfolder,
    );

    await this.cli.executeCommand(
      `node_modules/.bin/sequelize db:create --url ${connectionString}`,
    );
    this.cli.logger("Performing Migrations");
    await this.cli.executeCommand(
      `node_modules/.bin/sequelize db:migrate --url ${connectionString} --migrations-path=${migrationPath}/tenants`,
    );
    this.cli.logger("Seeding all database");
    await this.cli.executeCommand(
      `node_modules/.bin/sequelize db:seed:all --url ${connectionString} --seeders-path ${seedersPath}`,
    );
    await this.registry.attachTenantContext(uuid);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}
