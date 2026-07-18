const fs = require('fs');
const os = require('os');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');

const { TenantContextRegistry } = require('../build/contextRegistry');

const config = {
  datastore: {
    modelsfolder: 'database/models',
    seedersfolder: 'database/seeders',
    migrationsfolder: 'database/migrations',
    dbconfigfile: 'database/models/index',
  },
  'models-shared': {
    hostname: 'hostname.js',
  },
};

function createModelFile(cwd, filename, body) {
  const modelsPath = path.join(cwd, 'database', 'models');
  fs.mkdirSync(modelsPath, { recursive: true });
  fs.writeFileSync(path.join(modelsPath, filename), body);
}

function createSequelizeFactory(queryRows = []) {
  const instances = [];
  const factory = sinon.stub().callsFake((connectionString) => {
    const sequelize = {
      connectionString,
      config: {
        username: 'app',
        password: 'secret',
        host: 'localhost',
        port: 5432,
        database: 'defaultdb',
      },
      options: { dialect: 'postgres' },
      query: sinon.stub().resolves(queryRows),
      close: sinon.stub().resolves(),
    };
    instances.push(sequelize);
    return sequelize;
  });
  factory.instances = instances;
  return factory;
}

describe('TenantContextRegistry', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('remembers, resolves, and forgets hostnames case-insensitively', () => {
    const registry = new TenantContextRegistry(config, {}, process.cwd());

    registry.rememberHostname('Tenant.Example.com', 'tenant-1');
    expect(registry.resolveCachedHostname('tenant.example.com')).to.equal('tenant-1');

    registry.forgetHostname('TENANT.EXAMPLE.COM');
    expect(registry.resolveCachedHostname('tenant.example.com')).to.equal(undefined);
  });

  it('throws when a tenant context has not been initialized', () => {
    const registry = new TenantContextRegistry(config, {}, process.cwd());

    expect(() => registry.getContext('missing')).to.throw(
      "Tenant database context 'missing' has not been initialized",
    );
  });

  it('resolves uncached hostnames through the default database and caches them', async () => {
    const registry = new TenantContextRegistry(config, {}, process.cwd());
    registry.contexts.set('default', {
      sequelize: {
        query: sinon.stub().resolves([{ uuid: 'tenant-2' }]),
      },
    });

    const result = await registry.resolveHostname('tenant.example.com');

    expect(result).to.equal('tenant-2');
    expect(registry.resolveCachedHostname('TENANT.EXAMPLE.COM')).to.equal('tenant-2');
    expect(registry.defaultContext.sequelize.query.firstCall.args[0]).to.equal(
      'select uuid from hostnames where fqdn = ?',
    );
  });

  it('returns cached hostnames without querying the database', async () => {
    const registry = new TenantContextRegistry(config, {}, process.cwd());
    const query = sinon.stub().resolves([{ uuid: 'tenant-2' }]);
    registry.contexts.set('default', { sequelize: { query } });
    registry.rememberHostname('tenant.example.com', 'tenant-1');

    const result = await registry.resolveHostname('tenant.example.com');

    expect(result).to.equal('tenant-1');
    expect(query.notCalled).to.equal(true);
  });

  it('returns undefined when hostname lookup has no rows', async () => {
    const registry = new TenantContextRegistry(config, {}, process.cwd());
    registry.contexts.set('default', {
      sequelize: {
        query: sinon.stub().resolves([]),
      },
    });

    expect(await registry.resolveHostname('missing.example.com')).to.equal(undefined);
  });

  it('closes and removes existing contexts and ignores missing contexts', async () => {
    const registry = new TenantContextRegistry(config, {}, process.cwd());
    const close = sinon.stub().resolves();
    registry.contexts.set('tenant-1', { sequelize: { close } });

    await registry.closeAndRemove('tenant-1');
    await registry.closeAndRemove('tenant-1');

    expect(close.calledOnce).to.equal(true);
    expect(() => registry.getContext('tenant-1')).to.throw();
  });

  it('initializes the default context and hostname cache without opening tenant contexts', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'nmt-registry-'));
    createModelFile(
      cwd,
      'hostname.js',
      'module.exports = () => ({ name: "hostname", associate: (context) => { context.hostnameAssociated = true; } });',
    );
    createModelFile(
      cwd,
      'user.js',
      'module.exports = () => ({ name: "user", associate: (context) => { context.userAssociated = true; } });',
    );
    const createSequelize = createSequelizeFactory(
      [
        { uuid: 'tenant-1', fqdn: 'tenant.example.com' },
        { uuid: 'tenant-without-fqdn' },
      ],
    );
    const db = {
      sequelize: {
        config: {
          username: 'app',
          password: 'secret',
          host: 'localhost',
          port: 5432,
          database: 'defaultdb',
        },
        options: { dialect: 'postgres' },
      },
    };
    const configLoader = {
      requireFromProject: sinon.stub().returns(db),
      getTenantModelFiles: sinon.stub().resolves(['user.js']),
    };
    const registry = new TenantContextRegistry(config, configLoader, cwd, createSequelize);

    await registry.initialize();

    expect(registry.resolveCachedHostname('tenant.example.com')).to.equal('tenant-1');
    expect(registry.resolveCachedHostname('tenant-without-fqdn')).to.equal(undefined);
    expect(registry.getContext('default').hostname.name).to.equal('hostname');
    expect(registry.getContext('default').hostnameAssociated).to.equal(true);
    expect(() => registry.getContext('tenant-1')).to.throw(
      "Tenant database context 'tenant-1' has not been initialized",
    );
    expect(createSequelize.callCount).to.equal(1);
    expect(configLoader.getTenantModelFiles.called).to.equal(false);
  });

  it('attaches tenant contexts lazily and reuses an existing tenant context', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'nmt-registry-'));
    createModelFile(
      cwd,
      'hostname.js',
      'module.exports = () => ({ name: "hostname" });',
    );
    createModelFile(
      cwd,
      'user.js',
      'module.exports = () => ({ name: "user", associate: (context) => { context.userAssociated = true; } });',
    );
    const createSequelize = createSequelizeFactory(
      [{ uuid: 'tenant-1', fqdn: 'tenant.example.com' }],
    );
    const db = {
      sequelize: {
        config: {
          username: 'app',
          password: 'secret',
          host: 'localhost',
          port: 5432,
          database: 'defaultdb',
        },
        options: { dialect: 'postgres' },
      },
    };
    const configLoader = {
      requireFromProject: sinon.stub().returns(db),
      getTenantModelFiles: sinon.stub().resolves(['user.js']),
    };
    const registry = new TenantContextRegistry(config, configLoader, cwd, createSequelize);

    await registry.initialize();
    await registry.attachTenantContext('tenant-1');
    await registry.attachTenantContext('tenant-1');

    expect(registry.getContext('tenant-1').user.name).to.equal('user');
    expect(registry.getContext('tenant-1').userAssociated).to.equal(true);
    expect(configLoader.getTenantModelFiles.calledOnce).to.equal(true);
    expect(createSequelize.callCount).to.equal(2);
  });
});