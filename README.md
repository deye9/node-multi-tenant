# Multi-tenant Node.js Application

<img src="https://cdn-images-1.medium.com/max/1600/1*YJHmalZ71_3AekY06edhPg.png" alt="Multi-tenant Node.js Application">

(c) https://blog.lftechnology.com/designing-a-secure-and-scalable-multi-tenant-application-on-node-js-15ae13dda778

## Introduction

A big shout out to the folks at https://laravel-tenancy.com/ who served as an inspiration for this project. This is a Node.js version of their PHP code. Please note that this project is not in any way up to what they offer on PHP but it will get better with time.

Also will like to appreciate https://github.com/blugavere/node-repositories for being a source of inspiration for the repository used by the package.

Let's get down to Node.js business.

**Welcome to the unobtrusive Node.js package that makes your app multi tenant.**

Serving multiple websites, each with one or more hostnames from the same codebase but with clear separation of databases.

Suitable for all developers / companies or start-ups building the next software as a service and are interested in re-using functionality for different clients.

## Dependencies

This application relies heavily on sequelizejs for its database connections. Dialects supported as of now are MySQL, SQLite, PostgreSQL and MSSQL. You can read up here http://docs.sequelizejs.com/manual/installation/usage.html#dialects. Also the following packages are required dependencies

```
  -  "auto-bind": "^2.0.0",
  -  "pg": "^7.8.1",
  -  "sequelize": "^4.42.0",
  -  "sequelize-cli": "^5.4.0",
  -  "dotenv": "^6.2.0"
```

<!-- ## Caveats -->

## Installation

```sh
$ npm i node-multi-tenant
```
**or**
```sh
$ npm install --save https://github.com/deye9/node-multi-tenant
```

## Before you start

Drop all migrations for the tenants in the tenants folder.

1. A global emitter event is created, kindly emit the req.headers.host to it. It is highly recommended this be done in your routers file / module. Below is a sample code.

```

/*
 * Routes file
 *
 */

// Dependencies
const handlers = require('./lib/handlers');

const requestRouter = {
    /**
     * handles all route request.
     *
     * @param {String} trimmedPath [Fully Qualified Domain Name]
     * @param {String} requestUrl [req.headers.host]
     * @returns {String}
     */
    handleRequest(trimmedPath, requestUrl) {

        requestRouter.eventManager(requestUrl);

        switch (trimmedPath) {
            case '':
                return handlers.index;

            case 'favicon.ico':
                return handlers.favicon;

            case 'account/create':
                return handlers.accountCreate;

            case 'session/create':
                return handlers.sessionCreate;

            case 'ping':
                return handlers.ping;

            case 'api/menu':
                return handlers.menus;

            case 'public':
                return handlers.public;

            default:
                break;
        }
    },

    /**
     * emit the req.headers.host as an event to be consumed.
     *
     * @param {String} requestUrl
     */
    eventManager(requestUrl) {
        em.emit('requestUrl', requestUrl);
    }
};

// Export the routes
module.exports = {
    handleRequest: (trimmedPath, requestUrl) => requestRouter.handleRequest(trimmedPath, requestUrl)
};
```

2. Please call the tenantsInit() in your app init / startup module, as it modifies your connection to create an array of connections. Your main connection can be accessed via db['default']. Child connections will have the uuid passed to the db array for them to be available.

3. In your .env you need to set the TENANCY_DEFAULT_HOSTNAME variable. e.g  `TENANCY_DEFAULT_HOSTNAME=sample.dev`

4. To disable logging to the console by the package, set the CONSOLE_LOGGER variable in your .env file to false and back to true to enable logging to the console. `CONSOLE_LOGGER=false`

5. To enable / disable Audit log at the Repo level, set the value of the TENANCY_AUDIT_LOG variable in your .env file to true. Kindly note that the logging will only be implemented for Insert, Update and Delete calls that is action on by this package. Logging assumes that your primary key is named "id". Please note that when a tenant is dropped / deleted it is currently not logged. `TENANCY_AUDIT_LOG=true`

6. The test accomplying this package / codebase was written to use PostgresSQL

## Overview

To use any of the methods, kindly find a sample of what your import statement will look like:

```
  {
    create: create,
    update: update,
    delete: _delete,
    findAll: findAll,
    init: tenantsInit,
    truncate: truncate,
    findById: findById,
    currentDB: currentDB,
    findFirst: findFirst,
    createTenant: newTenant,
    tenantExists: validTenant,
    deleteTenant: removeTenant,
    updateTenant: updateTenant,
    executeQuery: executeQuery,
    getTenantConnectionString: getTenantConnectionString
  } = require('node-multi-tenant');
```

Available Methods:

- [cli methods](#cli)
- [create](#create)
- [currentDB](#currentDB)
- [createTenant](#createTenant)
- [delete](#delete)
- [deleteTenant](#deleteTenant)
- [executeQuery](#executeQuery)
- [findAll](#findAll)
- [findById](#findById)
- [findFirst](#findFirst)
- [getTenantConnectionString](#getTenantConnectionString)
- [init](#init)
- [tenantExists](#tenantExists)
- [truncate](#truncate)
- [update](#update)
- [updateTenant](#updateTenant)

**[⬆ back to top](#Overview)**

## cli

**Available Commands**

----------------------------------------------------------------------------------------------------------------------------------------------
                                                CLI MANUAL
----------------------------------------------------------------------------------------------------------------------------------------------


       exit                                        Kill the CLI (and the rest of the application)

       man                                         Show this help page

       help                                        Alias of the "man" command

       tenancy:init                                Installs the tenancy configurations file.

       tenancy:install                             Install the tenancy files based on configurations in the tenants/tenancy.js file

       tenancy:db:seed                             Seed the database with records

       tenancy:recreate                            Command to recreate all tenant databases that do not exist

       tenancy:db:unseed --{Action}                Undo all seeds [Action = recent, all]

       tenancy:migrate:refresh                     Reset and re-run all migrations

       tenancy:migrate:rollback                    Rollback the last database migration

       tenancy:migrate --{tenantID}                Run the database migrations on all or specific tenants. {IDs of tenants to migrate. e.g --tenantID=1 --tenantID=2}

----------------------------------------------------------------------------------------------------------------------------------------------

After the package has been installed. Run the **tenancy:init** command to setup the need files. Once the command has finished executing, you will notice a tenants folder in your root directory.
Inside that directory is a file called tenancy.js. Kind configure with the required path to the folders specified also remember to put in the name of the models you want to be shared. 
This models on the default database. Below is an example of a valid tenancy.js file

```
/*
 *
 * Configuaration file for the Node Multi Tenant Application.
 *
 */

// Dependencies
require('dotenv').config();

module.exports = {
    /**
     * Contains all the paths to your datastores.
     */
    'datastore': {
        modelsfolder: 'database/models',
        seedersfolder: 'database/seeders',
        migrationsfolder: 'database/migrations',
        dbconfigfile: 'database/models/index'
    },
    'models-shared': {
        'tenancy_hostname': 'hostname.js',
    }
};
```

Once you are done configuring your tenancy.js file, you now run **tenancy:install** to install and setup tenancy fully in your application and you are officially good to go.

**[⬆ back to top](#Overview)**

## create

Creates a record in the tenant using the model name supplied. You can either pass in a single object or an array of objects.

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- dataObject of type Object [Key value representation of the data to be created]

**Sample Code**

 const result = await create('Users', {
   firstName: 'First Name',
   lastName: 'Last Name',
   email: 'Email Address'
 }));

 or

  const result = await create('Users', [
    { firstName: 'test', lastName: "valid", email: "tested@yahoo.com" },
    { firstName: 'test1', lastName: "valid1", email: "tested1@yahoo.com" },
    { firstName: 'test2', lastName: "valid2", email: "tested2@yahoo.com" },
    { firstName: 'test3', lastName: "valid3", email: "tested3@yahoo.com" }
  ]);

**Return Type:**

Promise of type Model or Promise of type Array of Model

**[⬆ back to top](#Overview)**

## currentDB

**[⬆ back to top](#Overview)**

## createTenant

 Creates a tenant.

**Parameters**

- fqdn of type String [Fully Qualified Domain Name]

**Sample Code**

 const result = await newTenant('sample.dev');

**Return Type:**

Promise of type Model
{
    'website_id': id,
    'uuid': uuid,
    'fqdn': fqdn
};

**[⬆ back to top](#Overview)**

## delete

Remove the record from the tenant using the model name and key supplied

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- key of type Object [Key value representation of the data to be deleted]

**Sample Code**

 const result = await _delete('Users', {id:2});

**Return Type:**

Promise of Object [Returns back the key passed in]

**[⬆ back to top](#Overview)**

## deleteTenant

Deletes a tenant's records from the DB alongside the created DB.

**Parameters**

- fqdn of type String [Fully Qualified Domain Name]

**Sample Code**

 const result = await removeTenant('sample.dev');

**Return Type:**

Promise of type String [UUID of database]

**[⬆ back to top](#Overview)**

## executeQuery

Executes a raw sql query against the database.

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- sqlCommand of type String [Sql Command to be executed]

**Sample Code**

 const result = await executeQuery('hostname', 'select * from hostnames');

**Return Type:**

Promise of type Array Model

**[⬆ back to top](#Overview)**

## findAll

Gets an array of the values from the tenant based on conditions specified.

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- key of type Object [Key value representation of the data to be searched]

**Sample Code**

const result = await findAll('Users'));

or

const result = await findAll('Users', {id: {[Op.gte]: 3}}));

**Return Type:**

Promise of type Array of Model

**[⬆ back to top](#Overview)**

## findById

Gets the record from the tenant database by the Primary Key given.

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- id of type Integer [id of the field which is an integer value]

**Sample Code**

const result = await findById('Users', 16);

**Return Type:**

Promise of type Model

**[⬆ back to top](#Overview)**

## findFirst

Gets the first record from the tenant database matching the criteria given.

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- key of type Object [Key value representation of the data to be searched]

**Sample Code**

 const result = await findFirst('Users', {id: 10});

**Return Type:**

Promise of type String

**[⬆ back to top](#Overview)**

## getTenantConnectionString

Returns the connection string of the current / active tenant.

**Sample Code**

 const result = await getTenantConnectionString();

**Return Type:**

Promise of type String

**[⬆ back to top](#Overview)**

## init

Starts the multi_tenants CLI

**Sample Code**

 const result = await tenantsInit();

**[⬆ back to top](#Overview)**

## tenantExists

Checks if the tenant exists.

**Parameters**

- fqdn of type String [Fully Qualified Domain Name]

**Sample Code**

 const result = await validTenant('sample.dev');

**Return Type:**

Promise of type Model

**[⬆ back to top](#Overview)**

## truncate

Truncates a table on the tenant.

**Sample Code**

 const result = await truncate('Users');

**Return Type:**

Promise of type Integer The number of truncated rows

**[⬆ back to top](#Overview)**

## update

Updates the record in the tenant using the model name and the key supplied.

**Parameters**

- modelName of type String [Contains the name of the model to be used]
- key of type Object [Key value representation of the data to be updated]
- dataObject of type Object [Key value representation of the data to be updated]

**Sample Code**

 const result = await update('Users', {id:4}, { firstName: 'new First Name', lastName: 'new Last Name', email: 'new Email Address' });

**Return Type:**

Promise of type Array of Objects [key, dataObject]

**[⬆ back to top](#Overview)**

## updateTenant

Updates the tenant record to the new records passed in.

**Parameters**

- fqdn of type String [Fully Qualified Domain Name]
- dataObject of type Object [Key value representation of the tenant data to be updated]

**Sample Code**

 const result =   await updateTenant('sample.dev', {
    fqdn: 'qw',
    redirect_to: 'rtwewe',
    force_https: true,
    under_maintenance_since: null
  });

**Return Type:**

Promise of type Model

**[⬆ back to top](#Overview)**