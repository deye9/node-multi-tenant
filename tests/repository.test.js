const { expect } = require('chai');
const sinon = require('sinon');

const { TenantRepository } = require('../build/repository');
const { RepositoryError } = require('../build/errors');

function createRepository(model, currentTenant = 'tenant-1', auditModel) {
  const models = { user: model };
  if (auditModel) {
    models.audits = auditModel;
  }

  const registry = {
    getContext: sinon.stub().returns({
      sequelize: {
        model: (name) => models[name],
        query: sinon.stub().resolves([['ok']]),
      },
    }),
  };

  return {
    repository: new TenantRepository(registry, () => currentTenant),
    registry,
  };
}

describe('TenantRepository', () => {
  const previousAuditFlag = process.env.TENANCY_AUDIT_LOG;

  afterEach(() => {
    sinon.restore();
    if (previousAuditFlag === undefined) {
      delete process.env.TENANCY_AUDIT_LOG;
    } else {
      process.env.TENANCY_AUDIT_LOG = previousAuditFlag;
    }
  });

  it('creates a single entity through the active tenant model', async () => {
    const created = { dataValues: { id: 1, name: 'Ada' } };
    const model = { create: sinon.stub().resolves(created) };
    const { repository } = createRepository(model);

    const result = await repository.add('user', { name: 'Ada' });

    expect(result).to.equal(created);
    expect(model.create.calledOnceWithExactly({ name: 'Ada' })).to.equal(true);
  });

  it('uses bulkCreate when adding an array of entities', async () => {
    const records = [{ name: 'Ada' }, { name: 'Grace' }];
    const model = { bulkCreate: sinon.stub().resolves(records) };
    const { repository } = createRepository(model);

    const result = await repository.add('user', records);

    expect(result).to.equal(records);
    expect(model.bulkCreate.calledOnceWithExactly(records, { returning: true })).to.equal(true);
  });

  it('finds records with and without filters', async () => {
    const rows = [{ id: 1 }];
    const model = {
      findAll: sinon.stub().resolves(rows),
    };
    const { repository } = createRepository(model);

    expect(await repository.findAll('user')).to.equal(rows);
    expect(await repository.findAll('user', { active: true })).to.equal(rows);

    expect(model.findAll.firstCall.args).to.deep.equal([]);
    expect(model.findAll.secondCall.args).to.deep.equal([{ where: { active: true } }]);
  });

  it('wraps model failures in RepositoryError', async () => {
    const failure = new Error('database unavailable');
    const model = { findAll: sinon.stub().rejects(failure) };
    const { repository } = createRepository(model);

    try {
      await repository.findAll('user');
      throw new Error('Expected repository.findAll to fail');
    } catch (error) {
      expect(error).to.be.instanceOf(RepositoryError);
      expect(error.category).to.equal('DB');
      expect(error.previous).to.equal(failure);
      expect(error['Error Message']).to.equal('database unavailable');
    }
  });

  it('writes audit records for tenant mutations when enabled', async () => {
    process.env.TENANCY_AUDIT_LOG = 'true';
    const created = { dataValues: { id: 7, name: 'Ada' } };
    const model = { create: sinon.stub().resolves(created) };
    const auditModel = { create: sinon.stub().resolves({}) };
    const { repository } = createRepository(model, 'tenant-1', auditModel);

    await repository.add('user', { name: 'Ada' });

    expect(auditModel.create.calledOnce).to.equal(true);
    expect(auditModel.create.firstCall.args[0]).to.include({
      event: 'Create',
      model: 'user',
      record_id: 7,
    });
    expect(auditModel.create.firstCall.args[0].new_values).to.equal(
      JSON.stringify(created.dataValues),
    );
  });

  it('does not audit mutations on the default tenant', async () => {
    process.env.TENANCY_AUDIT_LOG = 'true';
    const created = { dataValues: { id: 1, name: 'Default' } };
    const model = { create: sinon.stub().resolves(created) };
    const auditModel = { create: sinon.stub().resolves({}) };
    const { repository } = createRepository(model, 'default', auditModel);

    await repository.add('user', { name: 'Default' });

    expect(auditModel.create.notCalled).to.equal(true);
  });

  it('removes records and audits the previous value', async () => {
    process.env.TENANCY_AUDIT_LOG = 'true';
    const oldRecord = { dataValues: { id: 8, name: 'Ada' } };
    const model = {
      findOne: sinon.stub().resolves(oldRecord),
      destroy: sinon.stub().resolves(1),
    };
    const auditModel = { create: sinon.stub().resolves({}) };
    const { repository } = createRepository(model, 'tenant-1', auditModel);

    const result = await repository.remove('user', { id: 8 });

    expect(result).to.equal(1);
    expect(model.findOne.calledOnceWithExactly({ where: { id: 8 } })).to.equal(true);
    expect(model.destroy.calledOnceWithExactly({ where: { id: 8 } })).to.equal(true);
    expect(auditModel.create.firstCall.args[0]).to.include({
      event: 'Remove',
      model: 'user',
      record_id: 8,
      new_values: '[]',
    });
  });

  it('truncates records and writes one audit row per removed record', async () => {
    process.env.TENANCY_AUDIT_LOG = 'true';
    const oldRecords = [
      { dataValues: { id: 1, name: 'Ada' } },
      { dataValues: { id: 2, name: 'Grace' } },
    ];
    const model = {
      findAll: sinon.stub().resolves(oldRecords),
      destroy: sinon.stub().resolves(2),
    };
    const auditModel = { create: sinon.stub().resolves({}) };
    const { repository } = createRepository(model, 'tenant-1', auditModel);

    const result = await repository.truncate('user');

    expect(result).to.equal(2);
    expect(model.destroy.calledOnceWithExactly({ truncate: true })).to.equal(true);
    expect(auditModel.create.callCount).to.equal(2);
    expect(auditModel.create.firstCall.args[0]).to.include({
      event: 'Truncate',
      model: 'user',
      record_id: 1,
    });
  });

  it('updates records and returns the model update result', async () => {
    process.env.TENANCY_AUDIT_LOG = 'true';
    const oldRecord = { dataValues: { id: 3, name: 'Old' } };
    const model = {
      findOne: sinon.stub().resolves(oldRecord),
      update: sinon.stub().resolves([1]),
    };
    const auditModel = { create: sinon.stub().resolves({}) };
    const { repository } = createRepository(model, 'tenant-1', auditModel);

    const result = await repository.update('user', { id: 3 }, { name: 'New' });

    expect(result).to.deep.equal([1]);
    expect(model.update.calledOnceWithExactly({ name: 'New' }, { where: { id: 3 } })).to.equal(true);
    expect(auditModel.create.firstCall.args[0]).to.include({
      event: 'Update',
      model: 'user',
      record_id: 3,
    });
  });

  it('finds by primary key and unwraps dataValues', async () => {
    const model = {
      findByPk: sinon.stub().resolves({ dataValues: { id: 4, name: 'Ada' } }),
    };
    const { repository } = createRepository(model);

    const result = await repository.findById('user', 4);

    expect(result).to.deep.equal({ id: 4, name: 'Ada' });
    expect(model.findByPk.calledOnceWithExactly(4)).to.equal(true);
  });

  it('finds one record and unwraps dataValues', async () => {
    const model = {
      findOne: sinon.stub().resolves({ dataValues: { id: 5, name: 'Grace' } }),
    };
    const { repository } = createRepository(model);

    const result = await repository.findOne('user', { id: 5 });

    expect(result).to.deep.equal({ id: 5, name: 'Grace' });
    expect(model.findOne.calledOnceWithExactly({ where: { id: 5 } })).to.equal(true);
  });

  it('executes raw SQL against the active tenant context', async () => {
    const query = sinon.stub().resolves([['ok']]);
    const registry = {
      getContext: sinon.stub().returns({ sequelize: { query } }),
    };
    const repository = new TenantRepository(registry, () => 'tenant-2');

    const result = await repository.execute('select 1');

    expect(result).to.deep.equal([['ok']]);
    expect(registry.getContext.calledOnceWithExactly('tenant-2')).to.equal(true);
    expect(query.calledOnceWithExactly('select 1')).to.equal(true);
  });
});