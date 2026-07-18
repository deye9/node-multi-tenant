const fs = require('fs');
const os = require('os');
const path = require('path');
const { expect } = require('chai');

const { ConfigLoader } = require('../build/config');

describe('ConfigLoader', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('returns an explicit config without reading from disk', () => {
    const config = {
      datastore: {
        modelsfolder: 'app/models',
        seedersfolder: 'app/seeders',
        migrationsfolder: 'app/migrations',
        dbconfigfile: 'app/models/index',
      },
      'models-shared': {
        hostname: 'hostname.js',
      },
    };

    const result = new ConfigLoader('/missing/project').readConfig(config);

    expect(result).to.equal(config);
  });

  it('uses the built-in test config when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';

    const result = new ConfigLoader().readConfig();

    expect(result.datastore.modelsfolder).to.equal('tests/database/models');
    expect(result['models-shared']).to.deep.equal({
      tenancy_hostname: 'hostname.js',
    });
  });

  it('loads tenants/tenancy.ts as the default project config', () => {
    delete process.env.NODE_ENV;
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'nmt-config-'));
    fs.mkdirSync(path.join(cwd, 'tenants'));
    fs.writeFileSync(
      path.join(cwd, 'tenants', 'tenancy.ts'),
      [
        'import type { TenancyConfig } from "node-multi-tenant";',
        'const config: TenancyConfig = {',
        '  datastore: {',
        '    modelsfolder: "database/models",',
        '    seedersfolder: "database/seeders",',
        '    migrationsfolder: "database/migrations",',
        '    dbconfigfile: "database/models/index",',
        '  },',
        '  "models-shared": { tenancy_hostname: "hostname.js" },',
        '};',
        'export default config;',
      ].join('\n'),
    );

    const result = new ConfigLoader(cwd).readConfig();

    expect(result.datastore.dbconfigfile).to.equal('database/models/index');
    expect(result['models-shared'].tenancy_hostname).to.equal('hostname.js');
  });

  it('falls back to tenants/tenancy.js when no TypeScript config exists', () => {
    delete process.env.NODE_ENV;
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'nmt-config-js-'));
    fs.mkdirSync(path.join(cwd, 'tenants'));
    fs.writeFileSync(
      path.join(cwd, 'tenants', 'tenancy.js'),
      [
        'module.exports = {',
        '  datastore: {',
        '    modelsfolder: "database/models",',
        '    seedersfolder: "database/seeders",',
        '    migrationsfolder: "database/migrations",',
        '    dbconfigfile: "database/models/index",',
        '  },',
        '  "models-shared": { tenancy_hostname: "hostname.js" },',
        '};',
      ].join('\n'),
    );

    const result = new ConfigLoader(cwd).readConfig();

    expect(result.datastore.modelsfolder).to.equal('database/models');
    expect(result['models-shared'].tenancy_hostname).to.equal('hostname.js');
  });

  it('excludes shared models and index.js from tenant model discovery', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'nmt-models-'));
    const modelsPath = path.join(cwd, 'database', 'models');
    fs.mkdirSync(modelsPath, { recursive: true });
    ['index.js', 'hostname.js', 'user.js', 'audit.js', 'readme.md'].forEach((file) => {
      fs.writeFileSync(path.join(modelsPath, file), '');
    });

    const result = await new ConfigLoader(cwd).getTenantModelFiles(
      'database/models',
      { tenancy_hostname: 'hostname.js' },
    );

    expect(result.sort()).to.deep.equal(['audit.js', 'user.js']);
  });
});