const { expect } = require('chai');
const sinon = require('sinon');

const tenantPackage = require('../build/main');

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

describe('public package exports', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('exposes the package facade from build/main.js', () => {
    expect(tenantPackage).to.include.keys([
      'init',
      'findAll',
      'createTenant',
      'tenantExists',
      'deleteTenant',
      'truncate',
      'delete',
      'findById',
      'executeQuery',
      'findFirst',
      'getTenantConnectionString',
      'create',
      'updateTenant',
      'update',
      'TenantService',
      'TenantRepository',
      'RepositoryError',
    ]);
  });

  it('keeps delete as the CommonJS alias for deleteRecord', () => {
    expect(tenantPackage.delete).to.equal(tenantPackage.deleteRecord);
  });

  it('delegates public facade calls to a configured TenantService instance', async () => {
    const prototype = tenantPackage.TenantService.prototype;
    sinon.stub(prototype, 'init').resolves();
    sinon.stub(prototype, 'findAll').resolves([{ id: 1 }]);
    sinon.stub(prototype, 'createTenant').resolves({ uuid: 'tenant-1' });
    sinon.stub(prototype, 'tenantExists').resolves({ uuid: 'tenant-1' });
    sinon.stub(prototype, 'deleteTenant').resolves(1);
    sinon.stub(prototype, 'truncate').resolves(2);
    sinon.stub(prototype, 'delete').resolves(3);
    sinon.stub(prototype, 'findById').resolves({ id: 4 });
    sinon.stub(prototype, 'executeQuery').resolves([['ok']]);
    sinon.stub(prototype, 'findFirst').resolves({ id: 5 });
    sinon.stub(prototype, 'getTenantConnectionString').resolves('postgres://tenant');
    sinon.stub(prototype, 'create').resolves({ id: 6 });
    sinon.stub(prototype, 'updateTenant').resolves([1]);
    sinon.stub(prototype, 'update').resolves({ key: { id: 7 } });

    await tenantPackage.init({ config });

    expect(await tenantPackage.findAll('user')).to.deep.equal([{ id: 1 }]);
    expect(await tenantPackage.createTenant('tenant.example.com')).to.deep.equal({ uuid: 'tenant-1' });
    expect(await tenantPackage.tenantExists('tenant.example.com')).to.deep.equal({ uuid: 'tenant-1' });
    expect(await tenantPackage.deleteTenant('tenant.example.com')).to.equal(1);
    expect(await tenantPackage.truncate('user')).to.equal(2);
    expect(await tenantPackage.delete('user', { id: 1 })).to.equal(3);
    expect(await tenantPackage.deleteRecord('user', { id: 1 })).to.equal(3);
    expect(await tenantPackage.findById('user', 4)).to.deep.equal({ id: 4 });
    expect(await tenantPackage.executeQuery('select 1')).to.deep.equal([['ok']]);
    expect(await tenantPackage.findFirst('user', { id: 5 })).to.deep.equal({ id: 5 });
    expect(await tenantPackage.getTenantConnectionString()).to.equal('postgres://tenant');
    expect(await tenantPackage.create('user', { name: 'Ada' })).to.deep.equal({ id: 6 });
    expect(await tenantPackage.updateTenant('tenant.example.com', { plan: 'pro' })).to.deep.equal([1]);
    expect(await tenantPackage.update('user', { id: 7 }, { name: 'Ada' })).to.deep.equal({
      key: { id: 7 },
    });

    expect(prototype.init.calledOnce).to.equal(true);
    expect(prototype.findAll.calledWith('user')).to.equal(true);
    expect(prototype.delete.calledTwice).to.equal(true);
  });
});