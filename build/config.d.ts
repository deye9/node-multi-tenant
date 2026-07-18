import { TenancyConfig } from "./types";
export declare class ConfigLoader {
    private readonly cwd;
    constructor(cwd?: string);
    readConfig(config?: TenancyConfig): TenancyConfig;
    requireFromProject<T = unknown>(filename: string): T;
    private readProjectConfig;
    private requireTypeScriptConfig;
    getTenantModelFiles(modelsFolder: string, sharedModels: Record<string, string>): Promise<string[]>;
}
