# Multi-tenant Node.js Application

<img src="https://cdn-images-1.medium.com/max/1600/1*YJHmalZ71_3AekY06edhPg.png" alt="Multi-tenant Node.js Application">

(c) https://blog.lftechnology.com/designing-a-secure-and-scalable-multi-tenant-application-on-node-js-15ae13dda778

## Installation

```sh
$ npm install --save https://github.com/deye9/node-multi-tenant
```

## Overview

Available Methods:

- [create](#mongodb-native-repository)
- [currentDB](./packages/inmem-repository/README.md)
- [createTenant](#postgresql)
- [delete](#mongodb-native-repository)
- [deleteTenant](#mongoose-repository)
- [findAll](#ajax)
- [findById](#mongodb-native-repository)
- [findFirst](#mongodb-native-repository)
- [Filesystem](#filesystem-repository)
- [getTenantConnectionString](#mongodb-native-repository)
- [init](./packages/redis-repository/README.md)
- [tenantExists](#cassandra)
- [update](#mongodb-native-repository)
- [updateTenant](#mongodb-native-repository)

This application relies heavily on sequelizejs for its database connections. Dialects supported as of now are MySQL, SQLite, PostgreSQL and MSSQL. You can read up here http://docs.sequelizejs.com/manual/installation/usage.html#dialects

After installation a postinstall event is fired which executes the postinstall.sh file. The postinstall.sh file basically creates a tenants folder and copies over a tenancy.js file there for easy configuration of the app. Access to dotenv is also needed.

Drop all migrations for the tenants in the tenants folder.

1. A global emitter event is created, kindly emit the req.headers.host to it.
2. Please call the tenantsInit() on your app init as it modifies your connection to create an array of connections. Your main connection can be accessed via db['default']. Child connections will have the uuid passed to the db array for them to be available.


http://docs.sequelizejs.com/manual/tutorial/migrations.html