import { genId } from '../src/helpers';
import { faker } from '@faker-js/faker';
import { ITenant } from '../src/modules/types';
import { tenants } from '../src/modules/tenant';

let tenantID: string;
let newTenant: ITenant;
const emptyTenant: ITenant = {} as ITenant;

describe('tenants module', () => {
  describe('tenant without a set db_name parameter', () => {
    beforeEach(async () => {
      // Create a new tenant
      newTenant = {
        createdAt: new Date(),
        updatedAt: new Date(),
        fqdn: faker.internet.domainName(),
        redirect_to: faker.string.nanoid(),
        force_https: faker.datatype.boolean(),
      };

      tenantID = await tenants.createTenant(newTenant);
    });

    afterEach(() => {
      // Dispose of the tenant Object
      newTenant = {
        fqdn: '',
        redirect_to: '',
        force_https: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Create Tenant
    it('should create a tenant and return the tenant ID', async () => {
      expect(tenantID).not.toBe('');
      expect(tenantID).toBeDefined();
      expect(tenantID).not.toBeNull();
      expect(tenantID).not.toBeUndefined();
    });

    it('should throw an error if the tenant already exists', async () => {
      await expect(tenants.createTenant(newTenant)).rejects.toThrow(
        'Tenant already exists',
      );
    });

    it('should throw an error if the tenant object is empty', async () => {
      await expect(tenants.createTenant(emptyTenant)).rejects.toThrow(
        'Tenant object is empty',
      );
    });

    // Get specific Tenant
    it('should throw an error if the tenant ID is empty', async () => {
      await expect(tenants.getTenant('')).rejects.toThrow('Tenant ID is empty');
    });

    it('should throw an error if the tenant does not exist', async () => {
      await expect(tenants.getTenant('null')).rejects.toThrow(
        'Tenant does not exist',
      );
    });

    it('should get a tenant by ID', async () => {
      const result = await tenants.getTenant(tenantID);

      expect(result).not.toBe('');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    // Get all Tenant based on the fqdn pattern matching
    it('should throw an error if the FQDN is empty', async () => {
      await expect(tenants.getTenants('')).rejects.toThrow('FQDN is empty');
    });

    it('should get all tenants', async () => {
      const result = await tenants.getTenants(newTenant.fqdn);

      expect(result).not.toBe('');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    // Get Tenant hostname
    it('should throw an error if the tenant ID is empty', async () => {
      await expect(tenants.getTenantHostname('')).rejects.toThrow(
        'Tenant ID is empty',
      );
    });

    it('should throw an error if the tenant does not exist', async () => {
      await expect(tenants.getTenantHostname('null')).rejects.toThrow(
        'Tenant does not exist',
      );
    });

    it('should get a tenant hostname', async () => {
      const result = await tenants.getTenantHostname(tenantID);

      expect(result).not.toBe('');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    // Get Tenant database name
    it('should throw an error if the tenant ID is empty', async () => {
      await expect(tenants.getTenantDBName('')).rejects.toThrow(
        'Tenant ID is empty',
      );
    });

    it('should throw an error if the tenant does not exist', async () => {
      await expect(tenants.getTenantDBName('null')).rejects.toThrow(
        'Tenant does not exist',
      );
    });

    it('should get a tenant database name', async () => {
      const result = await tenants.getTenantDBName(tenantID);

      expect(result).not.toBe('');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    // Get Tenant Connection String
    it('should throw an error if the tenant ID is empty', async () => {
      await expect(tenants.getTenantConnectionString('')).rejects.toThrow(
        'Tenant ID is empty',
      );
    });

    it('should throw an error if the tenant does not exist', async () => {
      await expect(tenants.getTenantConnectionString('null')).rejects.toThrow(
        'Tenant does not exist',
      );
    });

    it('should get a tenant connection string', async () => {
      const result = await tenants.getTenantConnectionString(tenantID);

      expect(result).not.toBe('');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    // Update Tenant Section
    it('should update a tenant', async () => {
      newTenant.db_name = genId();
      newTenant.fqdn = faker.internet.domainName();
      const result = await tenants.updateTenant(tenantID, newTenant);

      expect(result).not.toBe('');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    it('should throw an error if the tenant does not exist', async () => {
      await expect(tenants.updateTenant('null', newTenant)).rejects.toThrow(
        'Tenant does not exist',
      );
    });

    it('should throw an error if the tenant ID is empty', async () => {
      await expect(tenants.updateTenant('', emptyTenant)).rejects.toThrow(
        'Tenant ID is empty',
      );
    });

    it('should throw an error if the tenant object is empty', async () => {
      await expect(tenants.updateTenant('testID', emptyTenant)).rejects.toThrow(
        'Tenant object is empty',
      );
    });

    // Delete Tenant Section
    it('should delete a tenant', async () => {
      const result = await tenants.deleteTenant(tenantID);

      expect(result).toBe(true);
    });

    it('should throw an error if the tenant ID is empty', async () => {
      await expect(tenants.deleteTenant('')).rejects.toThrow(
        'Tenant ID is empty',
      );
    });

    it('should throw an error if the tenant does not exist', async () => {
      await expect(tenants.deleteTenant('null')).rejects.toThrow(
        'Tenant does not exist',
      );
    });
  });
});
