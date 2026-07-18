import fs from "fs";
import path from "path";
import { TenancyConfig } from "./types";

const testConfig: TenancyConfig = {
  datastore: {
    modelsfolder: "tests/database/models",
    seedersfolder: "tests/database/seeders",
    migrationsfolder: "tests/database/migrations",
    dbconfigfile: "tests/database/models/index",
  },
  "models-shared": {
    tenancy_hostname: "hostname.js",
  },
};

export class ConfigLoader {
  constructor(private readonly cwd: string = process.cwd()) {}

  readConfig(config?: TenancyConfig): TenancyConfig {
    if (config) {
      return config;
    }

    if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "test") {
      return testConfig;
    }

    return this.readProjectConfig();
  }

  requireFromProject<T = unknown>(filename: string): T {
    return require(path.resolve(this.cwd, filename));
  }

  private readProjectConfig(): TenancyConfig {
    const typescriptConfigPath = path.resolve(this.cwd, "tenants/tenancy.ts");
    if (fs.existsSync(typescriptConfigPath)) {
      return this.requireTypeScriptConfig(typescriptConfigPath);
    }

    return this.requireFromProject<TenancyConfig>("tenants/tenancy.js");
  }

  private requireTypeScriptConfig(filePath: string): TenancyConfig {
    const source = fs.readFileSync(filePath, "utf8");
    const compiledSource = source
      .replace(/^import\s+type\s+[^;]+;\s*$/gm, "")
      .replace(/const\s+config\s*:\s*TenancyConfig\s*=/, "const config =")
      .replace(/export\s+default\s+config\s*;?/, "module.exports = config;");

    const exports = {};
    const configModule = { exports };
    const configRequire = require;

    Function(
      "module",
      "exports",
      "require",
      compiledSource,
    )(configModule, exports, configRequire);

    return configModule.exports as TenancyConfig;
  }

  async getTenantModelFiles(
    modelsFolder: string,
    sharedModels: Record<string, string>,
  ): Promise<string[]> {
    const files = await fs.promises.readdir(
      path.resolve(this.cwd, modelsFolder),
    );
    const excludedFiles = new Set([...Object.values(sharedModels), "index.js"]);
    return files.filter(
      (file) => file.endsWith(".js") && !excludedFiles.has(file),
    );
  }
}
