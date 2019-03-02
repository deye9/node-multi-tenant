# Multi-tenant Node.js Application

<img src="https://cdn-images-1.medium.com/max/1600/1*YJHmalZ71_3AekY06edhPg.png" alt="Multi-tenant Node.js Application">

(c) https://blog.lftechnology.com/designing-a-secure-and-scalable-multi-tenant-application-on-node-js-15ae13dda778

## Introduction

A big shout out to the folks at https://laravel-tenancy.com/ who served as an inspiration for this project. This is a Node.js version of their PHP code. Please note that this project is not in any way up to what they offer on PHP but it can only get better with nodejs.

Also will like to appreciate https://github.com/blugavere/node-repositories for being a source of inspiration for the repository used by the package.

That being said let's get down to Node.js business.

**Welcome to the unobtrusive Node.js package that makes your app multi tenant.**

```
Serving multiple websites, each with one or more hostnames from the same codebase.
But with clear separation of databases.

Suitable for all developers / companies or start-ups building the next software 
as a service and are interested in re-using functionality for different clients.
```

## Requirements, recommended environment

This application relies heavily on sequelizejs for its database connections. Dialects supported as of now are MySQL, SQLite, PostgreSQL and MSSQL.
You can read up here http://docs.sequelizejs.com/manual/installation/usage.html#dialects. Also the following packages are required dependencies

```
  -  "auto-bind": "^2.0.0",
  -  "pg": "^7.8.1",
  -  "sequelize": "^4.42.0",
  -  "sequelize-cli": "^5.4.0",
  -  "uuid": "^3.3.2"
```

<!-- ## Caveats -->

## Installation

```sh
$ npm install --save https://github.com/deye9/node-multi-tenant
```

## Before you start

Drop all migrations for the tenants in the tenants folder.

1. A global emitter event is created, kindly emit the req.headers.host to it.
2. Please call the tenantsInit() on your app init as it modifies your connection to create an array of connections. Your main connection can be accessed via db['default']. Child connections will have the uuid passed to the db array for them to be available.

## Overview

To use any of the methods, kindly find a sample of what your import statement will look like:

```
  {
    create: create,
    update: update,
    delete: _delete,
    findAll: findAll,
    init: tenantsInit,
    findById: findById,
    currentDB: currentDB,
    findFirst: findFirst,
    createTenant: newTenant,
    tenantExists: validTenant,
    deleteTenant: removeTenant,
    updateTenant: updateTenant,
    getTenantConnectionString: getTenantConnectionString
  } = require('node-multi-tenant');
```

Available Methods:

- [create](#create)
- [currentDB](#currentDB)
- [createTenant](#createTenant)
- [delete](#delete)
- [deleteTenant](#deleteTenant)
- [findAll](#findAll)
- [findById](#findById)
- [findFirst](#findFirst)
- [getTenantConnectionString](#getTenantConnectionString)
- [init](#init)
- [tenantExists](#tenantExists)
- [update](#update)
- [updateTenant](#updateTenant)

**[⬆ back to top](#Overview)**

## create

 Creates a record in the tenant using the model name supplied.

**Parameters**

- modelName of type String
- dataObject of type Object

**Sample Code**

 const result = await create('Users', {
   firstName: 'Oluwakemi',
   lastName: 'Adeye',
   email: 'jenina_4u@yahoo.com'
 }));

**Return Type:**

Promise<Model>

**[⬆ back to top](#Overview)**

## currentDB

**[⬆ back to top](#Overview)**

## createTenant

**[⬆ back to top](#Overview)**

## delete

**[⬆ back to top](#Overview)**

## deleteTenant

**[⬆ back to top](#Overview)**

## findAll

**[⬆ back to top](#Overview)**

## findById

**[⬆ back to top](#Overview)**

## findFirst

**[⬆ back to top](#Overview)**

## getTenantConnectionString

**[⬆ back to top](#Overview)**

## init

**[⬆ back to top](#Overview)**

## tenantExists

**[⬆ back to top](#Overview)**

## update

**[⬆ back to top](#Overview)**

## updateTenant

**[⬆ back to top](#Overview)**

http://docs.sequelizejs.com/manual/tutorial/migrations.html