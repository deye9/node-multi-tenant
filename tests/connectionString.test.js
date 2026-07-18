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

  it('omits the port segment when no port is configured', () => {
    const sequelize = {
      config: {
        username: 'app',
        password: 'secret',
        host: 'db.internal',
        database: 'defaultdb',
      },
      options: {
        dialect: 'postgres',
      },
    };

    const result = buildConnectionString(sequelize);

    expect(result).to.equal('postgres://app:secret@db.internal/defaultdb');
  });

  it('URL-encodes credentials and database names with reserved characters', () => {
    const sequelize = {
      config: {
        username: 'app:user',
        password: 'p@ss:word/with?chars',
        host: 'db.internal',
        port: 5432,
        database: 'default/db',
      },
      options: {
        dialect: 'postgres',
      },
    };

    const result = buildConnectionString(sequelize, 'tenant:one/db');

    expect(result).to.equal('postgres://app%3Auser:p%40ss%3Aword%2Fwith%3Fchars@db.internal:5432/tenant%3Aone%2Fdb');
  });

  it('falls back to empty URL segments when optional fields are blank', () => {
    const sequelize = {
      config: {
        host: 'localhost',
      },
      options: {
        dialect: 'postgres',
      },
    };

    const result = buildConnectionString(sequelize);

    expect(result).to.equal('postgres://:@localhost/');
  });
});