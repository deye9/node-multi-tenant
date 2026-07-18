const { expect } = require('chai');

const { buildConnectionString } = require('../build/connectionString');

describe('buildConnectionString', () => {
  it('builds a Sequelize URL from the current database config', () => {
    const sequelize = {
      config: {
        username: 'app',
        password: 'secret',
        host: 'localhost',
        port: 5432,
        database: 'defaultdb',
      },
      options: {
        dialect: 'postgres',
      },
    };

    const result = buildConnectionString(sequelize);

    expect(result).to.equal('postgres://app:secret@localhost:5432/defaultdb');
  });

  it('can override the database name for tenant-specific connections', () => {
    const sequelize = {
      config: {
        username: 'app',
        password: '',
        host: 'db.internal',
        port: 5432,
        database: 'defaultdb',
      },
      options: {
        dialect: 'postgres',
      },
    };

    const result = buildConnectionString(sequelize, 'tenant-123');

    expect(result).to.equal('postgres://app:@db.internal:5432/tenant-123');
  });
});