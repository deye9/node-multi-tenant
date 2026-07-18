const { EventEmitter } = require('events');
const { expect } = require('chai');
const sinon = require('sinon');

const { TenancyCli } = require('../build/cli');
const { TenantService } = require('../build/tenantService');

const config = {
  datastore: {
    modelsfolder: 'database/models',
    seedersfolder: 'database/seeders',
    migrationsfolder: 'database/migrations',
    dbconfigfile: 'database/models/index',
  },
  'models-shared': {
    tenancy_hostname: 'hostname.js',
  },
};

function createService() {
  const eventEmitter = new EventEmitter();
  const service = new TenantService({ config, cwd: '/app', eventEmitter });
  const defaultSequelize = {
    config: {
      username: 'app',
      password: 'secret',
      host: 'localhost',
      port: 5432,
      database: 'defaultdb',
    },
    options: { dialect: 'postgres' },
  };
  const registry = {
    initialize: sinon.stub().resolves(),
    resolveCachedHostname: sinon.stub(),
    resolveHostname: sinon.stub().resolves(undefined),
    rememberHostname: sinon.stub(),
    forgetHostname: sinon.stub(),
    closeAndRemove: sinon.stub().resolves(),
    attachTenantContext: sinon.stub().resolves(),
    getContext: sinon.stub().returns({ sequelize: defaultSequelize }),
    defaultContext: { sequelize: defaultSequelize },
  };
  const repository = {
    add: sinon.stub().resolves({ id: 9, uuid: 'tenant-1' }),
    remove: sinon.stub().resolves(1),
    findOne: sinon.stub().resolves({ id: 9, uuid: 'tenant-1', fqdn: 'tenant.example.com' }),
    update: sinon.stub().resolves([1]),
    truncate: sinon.stub().resolves(3),
    findById: sinon.stub().resolves({ id: 4 }),
    findAll: sinon.stub().resolves([{ id: 1 }]),
    execute: sinon.stub().resolves([['ok']]),
  };
  const cli = {
    executeCommand: sinon.stub().resolves(true),
    logger: sinon.stub(),
    startInteractive: sinon.stub(),
  };

  service.registry = registry;
  service.repository = repository;
  service.cli = cli;
  return { service, eventEmitter, registry, repository, cli };
}

describe('TenantService', () => {
  const previousHostname = process.env.TENANCY_DEFAULT_HOSTNAME;

  afterEach(() => {
    sinon.restore();
    if (previousHostname === undefined) {
      delete process.env.TENANCY_DEFAULT_HOSTNAME;
    } else {
      process.env.TENANCY_DEFAULT_HOSTNAME = previousHostname;
    }
  });

  it('initializes once and wires requestUrl events to tenant resolution', async () => {
    const { service, eventEmitter, registry } = createService();
    registry.resolveHostname.withArgs('tenant.example.com').resolves('tenant-1');

    await service.init();
    await service.init();
    eventEmitter.emit('requestUrl', 'tenant.example.com');
    await new Promise((resolve) => setImmediate(resolve));

    expect(registry.initialize.calledOnce).to.equal(true);
    expect(registry.resolveHostname.calledWith('tenant.example.com')).to.equal(true);
    expect(registry.attachTenantContext.calledOnceWithExactly('tenant-1')).to.equal(true);
    expect(service.currentTenantId).to.equal('tenant-1');
  });

  it('shares in-flight initialization work across concurrent callers', async () => {
    const { service, eventEmitter, registry } = createService();
    let finishInitialization;
    registry.initialize.callsFake(() => new Promise((resolve) => {
      finishInitialization = resolve;
    }));

    const first = service.init();
    const second = service.init();

    expect(registry.initialize.calledOnce).to.equal(true);
    expect(eventEmitter.listenerCount('requestUrl')).to.equal(0);

    finishInitialization();
    await Promise.all([first, second]);
    await service.init();

    expect(registry.initialize.calledOnce).to.equal(true);
    expect(eventEmitter.listenerCount('requestUrl')).to.equal(1);
  });

  it('clears failed in-flight initialization so a later call can retry', async () => {
    const { service, eventEmitter, registry } = createService();
    registry.initialize.onFirstCall().rejects(new Error('initialization failed'));
    registry.initialize.onSecondCall().resolves();

    try {
      await service.init();
      throw new Error('Expected service.init to fail');
    } catch (error) {
      expect(error.message).to.equal('initialization failed');
    }

    await service.init();

    expect(registry.initialize.calledTwice).to.equal(true);
    expect(eventEmitter.listenerCount('requestUrl')).to.equal(1);
  });

  it('sets the default tenant during initialization when a default hostname is configured', async () => {
    const { service } = createService();
    process.env.TENANCY_DEFAULT_HOSTNAME = 'DEFAULT.EXAMPLE.COM';
    service.currentTenantId = 'tenant-9';

    await service.init();

    expect(service.currentTenantId).to.equal('default');
  });

  it('logs requestUrl tenant resolution failures without rejecting the event handler', async () => {
    const { service, eventEmitter, registry, cli } = createService();
    registry.resolveHostname.rejects(new Error('lookup failed'));

    await service.init();
    eventEmitter.emit('requestUrl', 'tenant.example.com');
    await new Promise((resolve) => setImmediate(resolve));

    expect(cli.logger.calledOnceWithExactly('lookup failed', '\x1b[31m%s\x1b[0m')).to.equal(true);
  });

  it('honors the configured default hostname and cached tenant hostnames', async () => {
    const { service, registry } = createService();
    process.env.TENANCY_DEFAULT_HOSTNAME = 'default.example.com';
    registry.resolveCachedHostname.withArgs('cached.example.com').returns('tenant-2');

    await service.setCurrentTenant();
    await service.setCurrentTenant('default.example.com');
    expect(service.currentTenantId).to.equal('default');

    await service.setCurrentTenant('cached.example.com');
    expect(service.currentTenantId).to.equal('tenant-2');
    expect(registry.attachTenantContext.calledOnceWithExactly('tenant-2')).to.equal(true);

    await service.setCurrentTenant('missing.example.com');
    expect(service.currentTenantId).to.equal('tenant-2');
  });

  it('creates a tenant, provisions its database, and caches the hostname', async () => {
    const { service, registry, repository, cli } = createService();
    service.currentTenantId = 'tenant-9';
    repository.add.callsFake(async () => {
      expect(service.currentTenantId).to.equal('default');
      return { id: 9, uuid: 'tenant-1' };
    });

    const result = await service.createTenant('tenant.example.com');

    expect(repository.add.calledWith('hostname', {
      fqdn: 'tenant.example.com',
      force_https: true,
    })).to.equal(true);
    expect(cli.executeCommand.callCount).to.equal(3);
    expect(registry.attachTenantContext.calledOnceWithExactly('tenant-1')).to.equal(true);
    expect(registry.rememberHostname.calledOnceWithExactly('tenant.example.com', 'tenant-1')).to.equal(true);
    expect(service.currentTenantId).to.equal('tenant-9');
    expect(result).to.deep.equal({
      website_id: 9,
      uuid: 'tenant-1',
      fqdn: 'tenant.example.com',
    });
  });

  it('deletes a tenant and restores default tenant context', async () => {
    const { service, registry, repository, cli } = createService();
    service.currentTenantId = 'tenant-9';

    const result = await service.deleteTenant('tenant.example.com');

    expect(result).to.equal(1);
    expect(repository.findOne.calledWith('hostname', { fqdn: 'tenant.example.com' })).to.equal(true);
    expect(repository.remove.calledWith('hostname', { fqdn: 'tenant.example.com' })).to.equal(true);
    expect(registry.closeAndRemove.calledOnceWithExactly('tenant-1')).to.equal(true);
    expect(registry.forgetHostname.calledOnceWithExactly('tenant.example.com')).to.equal(true);
    expect(cli.executeCommand.firstCall.args[0]).to.include('sequelize db:drop --url postgres://app:secret@localhost:5432/tenant-1');
    expect(service.currentTenantId).to.equal('default');
  });

  it('looks up tenant hostnames from the default context while preserving the active tenant', async () => {
    const { service, repository } = createService();
    service.currentTenantId = 'tenant-9';
    repository.findOne.callsFake(async () => {
      expect(service.currentTenantId).to.equal('default');
      return { id: 9, uuid: 'tenant-1', fqdn: 'tenant.example.com' };
    });

    const result = await service.tenantExists('tenant.example.com');

    expect(repository.findOne.calledOnceWithExactly('hostname', { fqdn: 'tenant.example.com' })).to.equal(true);
    expect(service.currentTenantId).to.equal('tenant-9');
    expect(result).to.deep.equal({ id: 9, uuid: 'tenant-1', fqdn: 'tenant.example.com' });
  });

  it('updates tenant fields without changing protected identity fields', async () => {
    const { service, repository } = createService();
    service.currentTenantId = 'tenant-9';
    repository.findOne.callsFake(async () => {
      expect(service.currentTenantId).to.equal('default');
      return {
        id: 2,
        fqdn: 'tenant.example.com',
        uuid: 'tenant-1',
        plan: 'basic',
      };
    });
    repository.update.callsFake(async () => {
      expect(service.currentTenantId).to.equal('default');
      return [1];
    });

    await service.updateTenant('tenant.example.com', {
      id: 99,
      fqdn: 'other.example.com',
      uuid: 'changed',
      plan: 'pro',
    });

    expect(repository.update.calledOnce).to.equal(true);
    expect(repository.update.firstCall.args).to.deep.equal([
      'hostname',
      { id: 2 },
      {
        id: 2,
        fqdn: 'tenant.example.com',
        uuid: 'tenant-1',
        plan: 'pro',
      },
    ]);
    expect(service.currentTenantId).to.equal('tenant-9');
  });

  it('delegates data operations to the repository after initialization', async () => {
    const { service, repository } = createService();

    expect(await service.tenantExists('tenant.example.com')).to.deep.equal({
      id: 9,
      uuid: 'tenant-1',
      fqdn: 'tenant.example.com',
    });
    expect(await service.getTenantConnectionString()).to.equal('postgres://app:secret@localhost:5432/defaultdb');
    expect(await service.truncate('user')).to.equal(3);
    expect(await service.delete('user', { id: 1 })).to.equal(1);
    expect(await service.create('user', { name: 'Ada' })).to.deep.equal({ id: 9, uuid: 'tenant-1' });
    expect(await service.update('user', { id: 1 }, { name: 'Ada' })).to.deep.equal({
      key: { id: 1 },
      dataObject: { name: 'Ada' },
    });
    expect(await service.findById('user', 4)).to.deep.equal({ id: 4 });
    expect(await service.findFirst('user', { id: 1 })).to.deep.equal({
      id: 9,
      uuid: 'tenant-1',
      fqdn: 'tenant.example.com',
    });
    expect(await service.findAll('user', { active: true })).to.deep.equal([{ id: 1 }]);
    expect(await service.executeQuery('select 1')).to.deep.equal([['ok']]);

    expect(repository.truncate.calledWith('user')).to.equal(true);
    expect(repository.remove.calledWith('user', { id: 1 })).to.equal(true);
    expect(repository.add.calledWith('user', { name: 'Ada' })).to.equal(true);
    expect(repository.execute.calledWith('select 1')).to.equal(true);
  });

  it('starts the interactive CLI when requested', () => {
    const startInteractive = sinon.stub(TenancyCli.prototype, 'startInteractive');

    const service = new TenantService({ config, startCli: true });

    expect(service).to.be.instanceOf(TenantService);
    expect(startInteractive.calledOnce).to.equal(true);
  });
});