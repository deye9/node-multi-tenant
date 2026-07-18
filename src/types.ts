import { EventEmitter } from "events";
import Sequelize = require("sequelize");

export type Dictionary<T = unknown> = Record<string, T>;

export interface DatastoreConfig {
  modelsfolder: string;
  seedersfolder: string;
  migrationsfolder: string;
  dbconfigfile: string;
}

export interface TenancyConfig {
  datastore: DatastoreConfig;
  "models-shared": Record<string, string>;
}

export interface DbContext {
  sequelize: Sequelize.Sequelize;
  Sequelize: typeof Sequelize;
  [modelName: string]: any;
}

export interface TenantRecord extends Dictionary {
  id?: number;
  uuid: string;
  fqdn?: string;
}

export interface TenantInitOptions {
  cwd?: string;
  config?: TenancyConfig;
  eventEmitter?: EventEmitter;
  startCli?: boolean;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
}
