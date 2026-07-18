import type { TenancyConfig } from "node-multi-tenant";

const config: TenancyConfig = {
  datastore: {
    modelsfolder: "database/models",
    seedersfolder: "database/seeders",
    migrationsfolder: "database/migrations",
    dbconfigfile: "database/models/index",
  },
  "models-shared": {
    tenancy_hostname: "hostname.js",
  },
};

export default config;
