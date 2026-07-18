import Sequelize = require("sequelize");
import { ConfigLoader } from "./config";
import { DbContext, TenancyConfig } from "./types";
export declare class TenantContextRegistry {
    private readonly config;
    private readonly configLoader;
    private readonly cwd;
    private readonly createSequelize;
    private readonly contexts;
    private readonly hostnames;
    constructor(config: TenancyConfig, configLoader: ConfigLoader, cwd?: string, createSequelize?: (connectionString: string, options: Sequelize.Options) => Sequelize.Sequelize);
    get defaultContext(): DbContext;
    getContext(connectionId: string): DbContext;
    initialize(): Promise<void>;
    attachTenantContext(uuid: string): Promise<void>;
    rememberHostname(fqdn: string, uuid: string): void;
    forgetHostname(fqdn: string): void;
    resolveCachedHostname(fqdn: string): string | undefined;
    resolveHostname(fqdn: string): Promise<string | undefined>;
    closeAndRemove(connectionId: string): Promise<void>;
    private attachContext;
}
