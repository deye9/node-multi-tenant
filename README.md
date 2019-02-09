# Multi-tenant Node.js Application

<img src="https://cdn-images-1.medium.com/max/1600/1*YJHmalZ71_3AekY06edhPg.png" alt="Multi-tenant Node.js Application">
(c) https://blog.lftechnology.com/designing-a-secure-and-scalable-multi-tenant-application-on-node-js-15ae13dda778

This application relies heavily on sequelizejs for its database connections. Dialects supported as of now are MySQL, SQLite, PostgreSQL and MSSQL. You can read up here http://docs.sequelizejs.com/manual/installation/usage.html#dialects

After installation a postinstall event is fired which executes the postinstall.sh file. The postinstall.sh file basically creates a tenants folder in the Migrations folder after which it moves all existing migration files to the tenants folder.

Drop all migrations for the tenants in the tenants folder.


http://docs.sequelizejs.com/manual/tutorial/migrations.html