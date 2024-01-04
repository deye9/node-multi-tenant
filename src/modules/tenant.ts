import { ITenant } from './types';
import prisma, { executeQuery, genId } from '../helpers';

export const tenants = {
  /**
   * Check if tenant exists based on fqdn or db_name
   *
   * @param db_name string {optional}
   * @param fqdn string {optional}
   * @param tenantID string {optional}
   *
   * @returns Promise<ITenant | null>
   */
  async tenantExists(
    db_name?: string,
    fqdn?: string,
    tenantID?: string,
  ): Promise<ITenant | null> {
    try {
      // Check if tenant exists
      const tenant = await prisma.hostname.findFirst({
        where: {
          OR: [{ fqdn }, { db_name }, { id: tenantID }],
        },
      });

      return tenant !== null ? tenant : null;
    } catch (error) {
      throw new Error(`Tenant Exists Error:  ${(error as Error).message}`);
    }
  },

  /*
   * Get specific tenant
   *
   * @param tenantID string
   *
   * @returns Promise<ITenant>
   */
  async getTenant(tenantID: string): Promise<ITenant> {
    // Check if tenant ID is empty
    if (tenantID === '') {
      throw new Error('Tenant ID is empty');
    }

    // Check if tenant exists
    const tenant = await this.tenantExists(undefined, undefined, tenantID);
    if (tenant === null) {
      throw new Error('Tenant does not exist');
    }

    return tenant;
  },

  /*
   * Get all tenants based on the fqdn pattern matching
   *
   * @param fqdn string
   *
   * @returns Promise<ITenant[]>
   */
  async getTenants(fqdn: string): Promise<ITenant[]> {
    // Check if fqdn is empty
    if (fqdn === '') {
      throw new Error('FQDN is empty');
    }

    // Get all tenants
    const tenants = await prisma.hostname.findMany({
      where: {
        fqdn: {
          contains: fqdn,
        },
      },
    });

    return tenants;
  },

  /*
   * Get specific tenant hostname
   *
   * @param tenantID string
   *
   * @returns Promise<string>
   *
   */
  async getTenantHostname(tenantID: string): Promise<string> {
    // Check if tenant ID is empty
    if (tenantID === '') {
      throw new Error('Tenant ID is empty');
    }

    // Check if tenant exists
    const tenant = await this.tenantExists(undefined, undefined, tenantID);
    if (tenant === null) {
      throw new Error('Tenant does not exist');
    }

    return tenant.fqdn;
  },

  /*
   * Get specific tenant database name
   *
   * @param tenantID string
   *
   * @returns Promise<string>
   *
   */
  async getTenantDBName(tenantID: string): Promise<string> {
    // Check if tenant ID is empty
    if (tenantID === '') {
      throw new Error('Tenant ID is empty');
    }

    // Check if tenant exists
    const tenant = await this.tenantExists(undefined, undefined, tenantID);
    if (tenant === null) {
      throw new Error('Tenant does not exist');
    }

    return tenant.db_name as string;
  },

  async getTenantConnectionString(tenantID: string): Promise<string> {
    // Check if tenant ID is empty
    if (tenantID === '') {
      throw new Error('Tenant ID is empty');
    }

    // Check if tenant exists
    const tenant = await this.tenantExists(undefined, undefined, tenantID);
    if (tenant === null) {
      throw new Error('Tenant does not exist');
    }

    // Split the database URL by the last slash
    const dbURL = String(process.env.DATABASE_URL).split('/');

    // Get the last element of the array
    const dbName = dbURL[dbURL.length - 1];

    // Replace the database name with the tenant database name
    const tenantDBURL = String(process.env.DATABASE_URL).replace(
      dbName,
      tenant.db_name as string,
    );

    // Return the tenant connection string
    return tenantDBURL;
  },

  /*
   * Create a new tenant
   *
   * @param tenant ITenant
   *
   * @returns Promise<string>
   */
  async createTenant(tenant: ITenant): Promise<string> {
    // Check if tenant object is empty
    if (Object.keys(tenant).length === 0) {
      throw new Error('Tenant object is empty');
    }

    // Check if tenant exists
    const tenantExist = await this.tenantExists(tenant.db_name, tenant.fqdn);
    if (tenantExist !== null) {
      throw new Error('Tenant already exists');
    }

    try {
      const tenantID = genId();
      const db_name = tenant.db_name || genId();

      // Create tenant hostname
      await prisma.hostname.create({
        data: {
          db_name,
          id: tenantID,
          fqdn: tenant.fqdn,
          redirect_to: tenant.redirect_to,
          force_https: tenant.force_https,
          under_maintenance_since: tenant.under_maintenance_since,
        },
      });

      // Create tenant database
      await executeQuery(`CREATE DATABASE "${db_name}";`);

      // Return the tenant id
      return tenantID;
    } catch (error) {
      throw new Error(`Create Tenant Error: ${(error as Error).message}`);
    }
  },

  /**
   * Delete a tenant
   *
   * @param tenantID string
   *
   * @returns Promise<boolean>
   */
  async deleteTenant(tenantID: string): Promise<boolean> {
    // Check if tenant ID is empty
    if (tenantID === '') {
      throw new Error('Tenant ID is empty');
    }

    // Check if tenant exists
    const tenant = await this.tenantExists(undefined, undefined, tenantID);
    if (tenant === null) {
      throw new Error('Tenant does not exist');
    }

    try {
      // Delete the tenant hostname
      await prisma.hostname.delete({
        where: {
          id: tenantID,
        },
      });

      // Drop the tenant database
      await executeQuery(`DROP DATABASE "${tenant.db_name}";`);

      return true;
    } catch (error) {
      throw new Error(`Delete Tenant Error: ${(error as Error).message}`);
    }
  },

  /*
   * Update a tenant
   *
   * @param tenantID string
   * @param tenant ITenant
   *
   * @returns Promise<boolean>
   */
  async updateTenant(tenantID: string, tenant: ITenant): Promise<boolean> {
    // Check if tenant ID is empty
    if (tenantID === '') {
      throw new Error('Tenant ID is empty');
    }

    // Check if tenant object is empty
    if (Object.keys(tenant).length === 0) {
      throw new Error('Tenant object is empty');
    }

    // Check if tenant exists
    const tenantExist = await this.tenantExists(undefined, undefined, tenantID);
    if (tenantExist === null) {
      throw new Error('Tenant does not exist');
    }

    try {
      const db_name = tenant.db_name || genId();

      // Update the tenant
      await prisma.hostname.update({
        where: {
          id: tenantID,
        },
        data: {
          db_name,
          fqdn: tenant.fqdn,
          redirect_to: tenant.redirect_to,
          force_https: tenant.force_https,
          under_maintenance_since: tenant.under_maintenance_since,
        },
      });

      // Rename the tenant database
      await executeQuery(
        `ALTER DATABASE "${tenantExist.db_name}" RENAME TO "${db_name}";`,
      );

      return true;
    } catch (error) {
      throw new Error(`Update Tenant Error: ${(error as Error).message}`);
    }
  },
};
