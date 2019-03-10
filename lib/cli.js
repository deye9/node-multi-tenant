/*
 * CLI-related tasks
 *
 */

// Dependencies
require('dotenv').config();
const util = require('util'),
  path = require('path'),
  events = require('events'),
  readline = require('readline'),
  {
    files: fileReader
  } = require('./fileHandler'),
  exec = util.promisify(require('child_process').exec),
  fileContent = fileReader.readconfig(),
  modelsPath = path.resolve(fileContent.datastore.modelsfolder),
  migrationPath = path.resolve(fileContent.datastore.migrationsfolder);

class _events extends events {}
const e = new _events();

// Instantiate the cli module object
const cli = {};

// Input handlers
e.on('man', () => {
  cli.responders.help();
});

e.on('help', () => {
  cli.responders.help();
});

e.on('exit', () => {
  cli.responders.exit();
});

e.on('tenancy:init', () => {
  cli.tenancy.init();
});

e.on('tenancy:install', () => {
  cli.tenancy.install();
});

e.on('tenancy:migrate', (tenants) => {

  // Get the tenants ID from the strings passed in
  const arr = tenants.split('--'),
    tenantID = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;

  // Only process the input if the user actually wrote something, otherwise ignore it
  if (tenantID) {
    cli.tenancy.migrate(tenants);
  } else {
    cli.tenancy.migrate();
  }
});

e.on('tenancy:recreate', () => {
  cli.tenancy.recreate();
});

e.on('tenancy:db:seed', () => {
  cli.tenancy.seed();
});

e.on('tenancy:db:unseed', (undoAction) => {
  // Get the tenants ID from the strings passed in
  const arr = undoAction.split('--');
  undoAction = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : 'all';

  // Convert undoAction to LowerCase.
  cli.tenancy.unseed(undoAction.toLowerCase());
});

e.on('tenancy:migrate:refresh', () => {
  cli.tenancy.refresh();
});

e.on('tenancy:migrate:rollback', () => {
  cli.tenancy.rollback();
});

// Responders and tenancy object
cli.tenancy = {};
cli.responders = {};

/**
 * Function to execute cli commands
 *
 * @param {String} message
 * @param {String} cliCommand
 */
cli.tenancy.executeCommand = async (cliCommand) => {
  const {
    stdout,
    stderr
  } = await exec(cliCommand);
  cli.logger('\x1b[36m%s\x1b[0m', `stdout: ${stdout}`);
  cli.horizontalLine();

  if (!stderr.toLowerCase().includes('sequelize deprecated string based operators are now deprecated')) {
    cli.logger('\x1b[31m%s\x1b[0m', `stderr: ${stderr}`);
    cli.horizontalLine();
  }
};

cli.tenancy.init = async () => {
  cli.logger('Attempting to copy over the tenants config folder to root.');
  await cli.tenancy.executeCommand(`cp -r node_modules/node-multi-tenant/tenants ${process.env.PWD}/`);
  cli.logger('Tenancy config folder copied successfully');
};

cli.tenancy.install = async () => {

  cli.logger('Starting Tenancy Installation');

  cli.logger('Attempting to create a tenants folder in the Migrations folder.');
  await cli.tenancy.executeCommand(`mkdir -p ${migrationPath}/tenants`);

  cli.logger('Moving existing migrations to the migrations/tenants folder.');
  await cli.tenancy.executeCommand(`mv ${migrationPath}/*.js ${migrationPath}/tenants`);

  cli.logger('Copying tenancy migration files to the migrations folder');
  await cli.tenancy.executeCommand(`cp node_modules/node-multi-tenant/dist/migrations/*.js ${migrationPath}/`);

  cli.logger('Copying tenancy model files to the models folder');
  await cli.tenancy.executeCommand(`cp node_modules/node-multi-tenant/dist/models/*.js ${modelsPath}/`);

  cli.logger('Attempting to drop existing database. Kindly ignore message if database does not exists');
  await cli.tenancy.executeCommand('node_modules/.bin/sequelize db:drop');

  cli.logger('Attempting to create the database');
  await cli.tenancy.executeCommand('node_modules/.bin/sequelize db:create');

  cli.logger('Performing Migrations');
  await cli.tenancy.executeCommand('node_modules/.bin/sequelize db:migrate');
  await cli.tenancy.executeCommand(`node_modules/.bin/sequelize db:migrate --migrations-path=${migrationPath}/tenants`);

  cli.logger('Seeding all database');
  await cli.tenancy.executeCommand('node_modules/.bin/sequelize db:seed:all');

  cli.logger('Tenancy Installation Completed Successfully');
};

// Run the database migrations on all or specific tenants. {IDs of tenants to migrate. e.g --tenantID=1 --tenantID=2}
cli.tenancy.migrate = async (tenants) => {
  if (tenants) {
    cli.logger('TODO');
  } else {
    await cli.tenancy.executeCommand('node_modules/.bin/sequelize db:migrate');
  }
};

// Command to recreate all tenant databases that do not exist
cli.tenancy.recreate = async () => {
  cli.logger('TODO');
};

// Seed the database with records
cli.tenancy.seed = async () => {
  await cli.tenancy.executeCommand('node_modules/.bin/sequelize db:seed:all');
};

// Undo all seeds [Action = recent, all]
cli.tenancy.unseed = (undoAction) => {
  if (undoAction == 'recent') {
    // undo most recent seed
    cli.tenancy.executeCommand('node_modules/.bin/sequelize db:seed:undo');
  } else {
    // undo all seeds
    cli.tenancy.executeCommand('node_modules/.bin/sequelize db:seed:undo:all');
  }
};

// Reset and re-run all migrations
cli.tenancy.refresh = () => {
  cli.tenancy.unseed('all');
  cli.tenancy.rollback();
  cli.tenancy.migrate();
};

// Rollback the last database migration
cli.tenancy.rollback = () => {
  cli.tenancy.executeCommand('node_modules/.bin/sequelize db:migrate:undo');
};

// Help / Man
cli.responders.help = () => {

  // Codify the commands and their explanations
  const commands = {
    'exit': 'Kill the CLI (and the rest of the application)',
    'man': 'Show this help page',
    'help': 'Alias of the "man" command',
    'tenancy:init': 'Installs the tenancy configurations file.',
    'tenancy:install': 'Install the tenancy files based on configurations in the tenants/tenancy.js file',
    'tenancy:db:seed': 'Seed the database with records',
    'tenancy:recreate': 'Command to recreate all tenant databases that do not exist',
    'tenancy:db:unseed --{Action}': 'Undo all seeds [Action = recent, all]',
    'tenancy:migrate:refresh': 'Reset and re-run all migrations',
    'tenancy:migrate:rollback': 'Rollback the last database migration',
    'tenancy:migrate --{tenantID}': 'Run the database migrations on all or specific tenants. {IDs of tenants to migrate. e.g --tenantID=1 --tenantID=2}'
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for (const key in commands) {
    if (commands.hasOwnProperty(key)) {
      const value = commands[key];
      let line = `      \x1b[33m ${key}      \x1b[0m`;
      const padding = 60 - line.length;
      for (let i = 0; i < padding; i++) {
        line += ' ';
      }
      line += value;
      cli.logger(line);
      cli.verticalSpace();
    }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
};

// Create a vertical space
cli.verticalSpace = lines => {
  lines = typeof lines == 'number' && lines > 0 ? lines : 1;
  for (let i = 0; i < lines; i++) {
    cli.logger('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = () => {

  // Get the available screen size
  const width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  let line = '';
  for (let i = 0; i < width; i++) {
    line += '-';
  }
  cli.logger('\x1b[34m%s\x1b[0m', line);
};

cli.logger = (color = '\x1b[37m%s\x1b[0m', message) => {
    if (typeof process.env.CONSOLE_LOGGER !== "undefined" && process.env.CONSOLE_LOGGER.toLowerCase() === 'true') {
      console.log(color, message);
    }
};

// Create centered text on the screen
cli.centered = str => {
  str = typeof str == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  let line = '';
  for (let i = 0; i < leftPadding; i++) {
    line += ' ';
  }
  line += str;
  cli.logger(line);
};

// Clear the console and Exit
cli.responders.exit = () => {
  console.clear();
  process.exit(0);
};

// Input processor
cli.processInput = str => {
  str = typeof str == 'string' && str.trim().length > 0 ? str.trim() : false;
  // Only process the input if the user actually wrote something, otherwise ignore it
  if (str) {
    // Codify the unique strings that identify the different unique questions allowed be the asked
    const uniqueInputs = [
      'man',
      'help',
      'exit',
      'tenancy:init',
      'tenancy:install',
      'tenancy:migrate',
      'tenancy:db:seed',
      'tenancy:recreate',
      'tenancy:db:unseed',
      'tenancy:migrate:refresh',
      'tenancy:migrate:rollback',
    ];

    // Go through the possible inputs, emit event when a match is found
    let matchFound = false;

    uniqueInputs.some(input => {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        // Emit event matching the unique input, and include the full string given
        e.emit(input, str);
        return true;
      }
    });

    // If no match is found, tell the user to try again
    if (!matchFound) {
      cli.logger('Sorry, try again');
    }
  }
};

// Init script
cli.init = () => {

  // Send to console, in dark blue
  cli.logger('\x1b[34m%s\x1b[0m', 'The CLI is running');

  // Start the interface
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>'
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on('line', str => {

    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();
  });

  // If the user stops the CLI, kill the associated process
  _interface.on('close', () => {
    console.clear();
    process.exit(0);
  });

};

// Export the module
module.exports = cli;