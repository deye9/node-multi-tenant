"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const fs = require("fs");
const path = require("path");
const testConfig = {
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
class ConfigLoader {
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
    }
    readConfig(config) {
        if (config) {
            return config;
        }
        if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "test") {
            return testConfig;
        }
        return this.readProjectConfig();
    }
    requireFromProject(filename) {
        return require(path.resolve(this.cwd, filename));
    }
    readProjectConfig() {
        const typescriptConfigPath = path.resolve(this.cwd, "tenants/tenancy.ts");
        if (fs.existsSync(typescriptConfigPath)) {
            return this.requireTypeScriptConfig(typescriptConfigPath);
        }
        return this.requireFromProject("tenants/tenancy.js");
    }
    requireTypeScriptConfig(filePath) {
        const source = fs.readFileSync(filePath, "utf8");
        const compiledSource = source
            .replace(/^import\s+type\s+[^;]+;\s*$/gm, "")
            .replace(/const\s+config\s*:\s*TenancyConfig\s*=/, "const config =")
            .replace(/export\s+default\s+config\s*;?/, "module.exports = config;");
        const exports = {};
        const configModule = { exports };
        const configRequire = require;
        Function("module", "exports", "require", compiledSource)(configModule, exports, configRequire);
        return configModule.exports;
    }
    async getTenantModelFiles(modelsFolder, sharedModels) {
        const files = await fs.promises.readdir(path.resolve(this.cwd, modelsFolder));
        const excludedFiles = new Set([...Object.values(sharedModels), "index.js"]);
        return files.filter((file) => file.endsWith(".js") && !excludedFiles.has(file));
    }
}
exports.ConfigLoader = ConfigLoader;
