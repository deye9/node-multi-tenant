const { expect } = require('chai');
const sinon = require('sinon');

const { TenancyCli } = require('../build/cli');

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

describe('TenancyCli', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('dispatches seed and migration commands without touching the database directly', async () => {
    const cli = new TenancyCli(config, process.cwd());
    const executeCommand = sinon.stub(cli, 'executeCommand').resolves(true);

    await cli.processInput('tenancy:db:seed');
    await cli.processInput('tenancy:migrate');
    await cli.processInput('tenancy:db:unseed --recent');

    expect(executeCommand.args.map(([command]) => command)).to.deep.equal([
      'node_modules/.bin/sequelize db:seed:all',
      'node_modules/.bin/sequelize db:migrate',
      'node_modules/.bin/sequelize db:seed:undo',
    ]);
  });

  it('dispatches rollback, refresh, unseed all, init, and install commands', async () => {
    const cli = new TenancyCli(config, '/app');
    const executeCommand = sinon.stub(cli, 'executeCommand').resolves(true);
    sinon.stub(console, 'log');

    await cli.processInput('tenancy:db:unseed --all');
    await cli.processInput('tenancy:migrate:rollback');
    await cli.processInput('tenancy:migrate:refresh');
    await cli.processInput('tenancy:init');
    await cli.processInput('tenancy:install');

    expect(executeCommand.args.map(([command]) => command)).to.deep.equal([
      'node_modules/.bin/sequelize db:seed:undo:all',
      'node_modules/.bin/sequelize db:migrate:undo',
      'node_modules/.bin/sequelize db:seed:undo:all',
      'node_modules/.bin/sequelize db:migrate:undo',
      'node_modules/.bin/sequelize db:migrate',
      'cp -r node_modules/node-multi-tenant/tenants /app/',
      'mkdir -p /app/database/migrations/tenants',
      'mv /app/database/migrations/*.js /app/database/migrations/tenants',
      'cp node_modules/node-multi-tenant/dist/migrations/*.js /app/database/migrations/',
      'cp node_modules/node-multi-tenant/dist/models/*.js /app/database/models/',
      'node_modules/.bin/sequelize db:drop',
      'node_modules/.bin/sequelize db:create',
      'node_modules/.bin/sequelize db:migrate',
      'node_modules/.bin/sequelize db:migrate --migrations-path=/app/database/migrations/tenants',
      'node_modules/.bin/sequelize db:seed:all',
    ]);
  });

  it('ignores blank input and reports unknown commands', async () => {
    const cli = new TenancyCli(config, process.cwd());
    const executeCommand = sinon.stub(cli, 'executeCommand').resolves(true);
    const log = sinon.stub(console, 'log');

    await cli.processInput('   ');
    await cli.processInput('unknown');

    expect(executeCommand.notCalled).to.equal(true);
    expect(log.calledOnceWithExactly('Sorry, try again')).to.equal(true);
  });

  it('executes shell commands and reports success, stderr failure, and thrown failures', async () => {
    const cli = new TenancyCli(config, process.cwd());
    const log = sinon.stub(console, 'log');

    expect(await cli.executeCommand('node -e "console.log(\'ok\')"')).to.equal(true);
    expect(await cli.executeCommand('node -e "console.error(\'bad\')"')).to.equal(false);
    expect(await cli.executeCommand('node -e "process.exit(2)"')).to.equal(false);
    expect(log.callCount).to.be.greaterThan(2);
  });

  it('prints help that points users at tenants/tenancy.ts', async () => {
    const cli = new TenancyCli(config, process.cwd());
    const log = sinon.stub(console, 'log');

    await cli.processInput('help');

    const output = log.args.map((args) => args.join(' ')).join('\n');
    expect(output).to.include('tenants/tenancy.ts');
    expect(output).not.to.include('tenants/tenancy.js');
  });

  it('only logs application messages when CONSOLE_LOGGER is true', () => {
    const previousValue = process.env.CONSOLE_LOGGER;
    const cli = new TenancyCli(config, process.cwd());
    const log = sinon.stub(console, 'log');

    delete process.env.CONSOLE_LOGGER;
    cli.logger('hidden');
    process.env.CONSOLE_LOGGER = 'true';
    cli.logger('visible');

    expect(log.calledOnce).to.equal(true);
    expect(log.firstCall.args).to.include('visible');

    if (previousValue === undefined) {
      delete process.env.CONSOLE_LOGGER;
    } else {
      process.env.CONSOLE_LOGGER = previousValue;
    }
  });
});