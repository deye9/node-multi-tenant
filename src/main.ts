import { TenantService } from "./tenantService";
import { Dictionary, TenantInitOptions } from "./types";

declare global {
  namespace NodeJS {
    interface Global {
      em: import("events").EventEmitter;
    }
  }
}

let service: TenantService | undefined;

function getService(options?: TenantInitOptions): TenantService {
  if (!service || options) {
    service = new TenantService(options);
  }
  return service;
}

export const init = (options?: TenantInitOptions): Promise<void> =>
  getService(options).init();
export const findAll = (modelName: string, key?: Dictionary): Promise<any[]> =>
  getService().findAll(modelName, key);
export const createTenant = (fqdn: string): Promise<Dictionary> =>
  getService().createTenant(fqdn);
export const tenantExists = (fqdn: string): Promise<Dictionary> =>
  getService().tenantExists(fqdn);
export const deleteTenant = (fqdn: string): Promise<number> =>
  getService().deleteTenant(fqdn);
export const truncate = (modelName: string): Promise<number> =>
  getService().truncate(modelName);
export const deleteRecord = (
  modelName: string,
  key: Dictionary,
): Promise<number> => getService().delete(modelName, key);
export { deleteRecord as delete };
export const findById = (modelName: string, id: number): Promise<Dictionary> =>
  getService().findById(modelName, id);
export const executeQuery = (sqlCommand: string): Promise<any[]> =>
  getService().executeQuery(sqlCommand);
export const findFirst = (
  modelName: string,
  key: Dictionary,
): Promise<Dictionary> => getService().findFirst(modelName, key);
export const getTenantConnectionString = (): Promise<string> =>
  getService().getTenantConnectionString();
export const create = (
  modelName: string,
  dataObject: Dictionary | Dictionary[],
): Promise<any> => getService().create(modelName, dataObject);
export const updateTenant = (
  fqdn: string,
  dataObject: Dictionary,
): Promise<any> => getService().updateTenant(fqdn, dataObject);
export const update = (
  modelName: string,
  key: Dictionary,
  dataObject: Dictionary,
): Promise<Dictionary> => getService().update(modelName, key, dataObject);

export { TenantService } from "./tenantService";
export { TenantRepository } from "./repository";
export { RepositoryError } from "./errors";
export type {
  DatastoreConfig,
  DbContext,
  Dictionary,
  TenancyConfig,
  TenantInitOptions,
  TenantRecord,
} from "./types";

module.exports = {
  init,
  findAll,
  createTenant,
  tenantExists,
  deleteTenant,
  truncate,
  deleteRecord,
  delete: deleteRecord,
  findById,
  executeQuery,
  findFirst,
  getTenantConnectionString,
  create,
  updateTenant,
  update,
  TenantService,
  TenantRepository: require("./repository").TenantRepository,
  RepositoryError: require("./errors").RepositoryError,
};
