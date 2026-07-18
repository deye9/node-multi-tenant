import { TenantContextRegistry } from "./contextRegistry";
import { Dictionary } from "./types";
export declare class TenantRepository {
    private readonly registry;
    private readonly currentTenant;
    constructor(registry: TenantContextRegistry, currentTenant: () => string);
    add(modelName: string, entity: Dictionary | Dictionary[]): Promise<any>;
    remove(modelName: string, keyValue: Dictionary): Promise<number>;
    truncate(modelName: string): Promise<number>;
    update(modelName: string, key: Dictionary, dataObject: Dictionary): Promise<any>;
    getAll(modelName: string): Promise<any[]>;
    findById(modelName: string, pk: number): Promise<Dictionary>;
    findAll(modelName: string, keyValue?: Dictionary): Promise<any[]>;
    findOne(modelName: string, keyValue: Dictionary): Promise<Dictionary>;
    execute(sqlCommand: string): Promise<any[]>;
    private collection;
    private audit;
    private capture;
}
