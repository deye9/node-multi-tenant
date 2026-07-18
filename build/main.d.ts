import { Dictionary, TenantInitOptions } from "./types";
declare global {
    namespace NodeJS {
        interface Global {
            em: import("events").EventEmitter;
        }
    }
}
export declare const init: (options?: TenantInitOptions) => Promise<void>;
export declare const findAll: (modelName: string, key?: Dictionary) => Promise<any[]>;
export declare const createTenant: (fqdn: string) => Promise<Dictionary>;
export declare const tenantExists: (fqdn: string) => Promise<Dictionary>;
export declare const deleteTenant: (fqdn: string) => Promise<number>;
export declare const truncate: (modelName: string) => Promise<number>;
export declare const deleteRecord: (modelName: string, key: Dictionary) => Promise<number>;
export { deleteRecord as delete };
export declare const findById: (modelName: string, id: number) => Promise<Dictionary>;
export declare const executeQuery: (sqlCommand: string) => Promise<any[]>;
export declare const findFirst: (modelName: string, key: Dictionary) => Promise<Dictionary>;
export declare const getTenantConnectionString: () => Promise<string>;
export declare const create: (modelName: string, dataObject: Dictionary | Dictionary[]) => Promise<any>;
export declare const updateTenant: (fqdn: string, dataObject: Dictionary) => Promise<any>;
export declare const update: (modelName: string, key: Dictionary, dataObject: Dictionary) => Promise<Dictionary>;
export { TenantService } from "./tenantService";
export { TenantRepository } from "./repository";
export { RepositoryError } from "./errors";
export type { DatastoreConfig, DbContext, Dictionary, TenancyConfig, TenantInitOptions, TenantRecord, } from "./types";
