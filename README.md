# node-multi-tenant

`node-multi-tenant` helps one Node.js application serve many customers, brands, or websites from the same codebase while keeping each tenant's data in its own database.

In plain terms: if you are building a SaaS product and want `customer-a.example.com` and `customer-b.example.com` to run on the same application but store data separately, this package gives you the tenant lookup, tenant database connection management, setup commands, and repository helpers to do that with minimal wiring.

The package is authored in TypeScript, published as CommonJS, and includes generated type declarations. Existing JavaScript projects can continue using `require('node-multi-tenant')`; TypeScript projects get typed imports.

## Who This Is For

Use this package when you want:

- One application codebase serving multiple tenant hostnames.
- A default database that stores tenant hostname records.
- A separate database connection per tenant.
- Helper methods for tenant-aware create, read, update, delete, truncate, and raw SQL calls.
- A package-friendly integration that can be initialized during application startup.

This package is useful for SaaS products, white-label platforms, internal portals with client-specific data separation, and applications where each customer should have isolated database storage.

## How It Works

At a high level, the package uses two kinds of database connections:

1. The default connection points to your main application database. It contains the tenant hostname table.
2. Tenant connections point to tenant-specific databases. Each tenant database is selected by resolving the incoming request hostname.

The normal request flow looks like this:

1. Your application starts and calls `init()`.
2. The package reads `tenants/tenancy.ts` and your Sequelize database config.
3. The package loads the default database connection.
4. The package reads the known hostnames from the default database.
5. For each incoming request, your app emits the request host, for example `tenant-a.example.com`.
6. The package switches the active tenant context for repository calls.
7. Calls like `findAll('Users')` or `create('Orders', data)` run against the active tenant database.

## Requirements

- Node.js project using CommonJS or TypeScript.
- Sequelize v5-compatible setup.
- `sequelize-cli` available in the consuming application.
- A Sequelize database config file, usually `database/models/index`.
- Tenant model files and migrations organized in your application.
- PostgreSQL is the current primary tested database path for this package.

Installed runtime dependencies include:

- `auto-bind`
- `dotenv`
- `pg`
- `sequelize`
- `sequelize-cli`

## Installation

Install from npm:

```sh
npm install node-multi-tenant
```

Or install directly from GitHub:

```sh
npm install --save https://github.com/deye9/node-multi-tenant
```

## Quick Start

### 1. Install The Package

```sh
npm install node-multi-tenant
```

### 2. Add The Tenancy Config Template

Run the package CLI command from your application root:

```sh
node -e "require('node-multi-tenant').init({ startCli: true }).catch(console.error)"
```

When the prompt opens, run:

```text
tenancy:init
```

This copies the `tenants` folder into your project. New projects should use `tenants/tenancy.ts`.

### 3. Configure `tenants/tenancy.ts`

The generated config tells the package where your models, migrations, seeders, and default Sequelize config live.

```ts
import type { TenancyConfig } from "node-multi-tenant";

const config: TenancyConfig = {
  datastore: {
    modelsfolder: "database/models",
    seedersfolder: "database/seeders",
    migrationsfolder: "database/migrations",
    dbconfigfile: "database/models/index",
  },
  "models-shared": {
    tenancy_hostname: "hostname.js",
  },
};

export default config;
```

Configuration fields:

- `modelsfolder`: folder containing your Sequelize model files.
- `seedersfolder`: folder containing your Sequelize seed files.
- `migrationsfolder`: folder containing your Sequelize migration files.
- `dbconfigfile`: module path to your Sequelize database context.
- `models-shared`: model files that belong to the default database and should not be loaded into every tenant context.

Existing applications that still have `tenants/tenancy.js` are supported as a fallback, but `tenants/tenancy.ts` is the recommended config file for new setups.

### 4. Configure Environment Variables

Add these to your `.env` file as needed:

```env
TENANCY_DEFAULT_HOSTNAME=sample.dev
CONSOLE_LOGGER=false
TENANCY_AUDIT_LOG=false
```

Environment variables:

- `TENANCY_DEFAULT_HOSTNAME`: host that should use the default database context.
- `CONSOLE_LOGGER`: set to `true` to allow package log messages.
- `TENANCY_AUDIT_LOG`: set to `true` to write audit records for supported repository mutations.

Audit logging currently applies to package-driven insert, update, delete, and truncate operations. It assumes the primary key field is named `id`.

### 5. Initialize Tenancy During App Startup

JavaScript CommonJS example:

```js
const { EventEmitter } = require("events");
const tenancy = require("node-multi-tenant");

global.em = new EventEmitter();

async function startApp() {
  await tenancy.init();
  // Start your HTTP server after tenancy is initialized.
}

startApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

TypeScript example:

```ts
import { EventEmitter } from "events";
import { init } from "node-multi-tenant";

(global as any).em = new EventEmitter();

async function startApp(): Promise<void> {
  await init();
  // Start your HTTP server after tenancy is initialized.
}

startApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### 6. Emit The Request Host On Every Request

The package listens for a `requestUrl` event. Emit the request hostname before calling tenant-aware package methods.

Express example:

```js
app.use((req, res, next) => {
  global.em.emit("requestUrl", req.headers.host);
  next();
});
```

Generic router example:

```js
function handleRequest(req, res) {
  global.em.emit("requestUrl", req.headers.host);

  // Your route handler can now call tenant-aware repository helpers.
}
```

Best result: emit the request host as early as possible in your request pipeline, before controller or service code reads tenant data.

## Advanced Initialization

For larger applications, tests, worker processes, or dependency-injected systems, use `TenantService` directly.

```ts
import { EventEmitter } from "events";
import { TenantService, type TenancyConfig } from "node-multi-tenant";

const config: TenancyConfig = {
  datastore: {
    modelsfolder: "database/models",
    seedersfolder: "database/seeders",
    migrationsfolder: "database/migrations",
    dbconfigfile: "database/models/index",
  },
  "models-shared": {
    tenancy_hostname: "hostname.js",
  },
};

const tenancy = new TenantService({
  cwd: process.cwd(),
  config,
  eventEmitter: new EventEmitter(),
  startCli: false,
});

await tenancy.init();
```

`TenantService` options:

- `cwd`: project root used for loading config, models, and migrations.
- `config`: explicit tenancy config. Use this when you do not want the package to read `tenants/tenancy.ts` from disk.
- `eventEmitter`: custom event emitter. If omitted, the package uses `global.em`.
- `startCli`: set to `true` to start the interactive tenancy CLI.

## CLI Commands

Start the interactive CLI with:

```js
require("node-multi-tenant").init({ startCli: true }).catch(console.error);
```

Available commands:

| Command                      | What It Does                                                            |
| ---------------------------- | ----------------------------------------------------------------------- |
| `help`                       | Shows the CLI help page.                                                |
| `man`                        | Alias for `help`.                                                       |
| `exit`                       | Stops the CLI process.                                                  |
| `tenancy:init`               | Copies the `tenants` config folder into your project.                   |
| `tenancy:install`            | Installs tenancy migrations/models and prepares the database structure. |
| `tenancy:db:seed`            | Runs all configured Sequelize seeders.                                  |
| `tenancy:db:unseed --recent` | Rolls back the most recent seed.                                        |
| `tenancy:db:unseed --all`    | Rolls back all seeds.                                                   |
| `tenancy:migrate`            | Runs Sequelize migrations.                                              |
| `tenancy:migrate:rollback`   | Rolls back the last migration.                                          |
| `tenancy:migrate:refresh`    | Rolls back seeds and the last migration, then reruns migrations.        |

Important: `tenancy:install` runs database setup commands including `sequelize db:drop`, `sequelize db:create`, and migrations. Use it only in the intended environment and make sure you have backups before running it against any database that contains important data.

## Public API

You can import the package as CommonJS:

```js
const {
  init,
  create,
  update,
  delete: deleteRecord,
  findAll,
  truncate,
  findById,
  findFirst,
  createTenant,
  tenantExists,
  deleteTenant,
  updateTenant,
  executeQuery,
  getTenantConnectionString,
} = require("node-multi-tenant");
```

Or with TypeScript / ES imports:

```ts
import {
  init,
  create,
  update,
  deleteRecord,
  findAll,
  truncate,
  findById,
  findFirst,
  createTenant,
  tenantExists,
  deleteTenant,
  updateTenant,
  executeQuery,
  getTenantConnectionString,
  TenantService,
} from "node-multi-tenant";
```

### `init(options?)`

Initializes tenancy. Call this once during application startup before serving requests.

```js
await init();
```

With options:

```js
await init({
  cwd: process.cwd(),
  config: tenancyConfig,
  eventEmitter: global.em,
  startCli: false,
});
```

### `create(modelName, dataObject)`

Creates one or more records in the current tenant database.

```js
const user = await create("Users", {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
});
```

Bulk create:

```js
const users = await create("Users", [
  { firstName: "Ada", email: "ada@example.com" },
  { firstName: "Grace", email: "grace@example.com" },
]);
```

### `findAll(modelName, key?)`

Finds records in the current tenant database.

```js
const users = await findAll("Users");
const activeUsers = await findAll("Users", { active: true });
```

### `findFirst(modelName, key)`

Finds the first matching record.

```js
const user = await findFirst("Users", { email: "ada@example.com" });
```

### `findById(modelName, id)`

Finds a record by primary key.

```js
const user = await findById("Users", 16);
```

### `update(modelName, key, dataObject)`

Updates matching records in the current tenant database.

```js
await update("Users", { id: 16 }, { lastName: "Byron" });
```

### `deleteRecord(modelName, key)` / `delete(modelName, key)`

Deletes matching records in the current tenant database.

```js
await deleteRecord("Users", { id: 16 });
```

CommonJS alias:

```js
const { delete: removeRecord } = require("node-multi-tenant");

await removeRecord("Users", { id: 16 });
```

### `truncate(modelName)`

Truncates a model table in the current tenant database.

```js
await truncate("TemporaryRecords");
```

Use this carefully. It removes all rows for the model in the active tenant database.

### `executeQuery(sqlCommand)`

Executes raw SQL against the current tenant database.

```js
const rows = await executeQuery("select * from users limit 10");
```

Best result: use parameterized Sequelize model methods for user-provided data. Only use raw SQL for trusted, reviewed queries.

### `getTenantConnectionString()`

Returns the connection string for the current tenant context.

```js
const connectionString = await getTenantConnectionString();
```

### `createTenant(fqdn)`

Creates a new tenant hostname record, provisions the tenant database, runs tenant migrations, runs seeders, and caches the hostname.

```js
const tenant = await createTenant("customer-a.example.com");
```

Returns:

```js
{
  website_id: 1,
  uuid: 'generated-tenant-database-id',
  fqdn: 'customer-a.example.com'
}
```

### `tenantExists(fqdn)`

Checks whether a tenant hostname exists.

```js
const tenant = await tenantExists("customer-a.example.com");
```

### `updateTenant(fqdn, dataObject)`

Updates a tenant hostname record. Protected identity fields such as `id`, `fqdn`, and `uuid` are preserved from the existing tenant record.

```js
await updateTenant("customer-a.example.com", {
  redirect_to: "https://www.example.com",
  force_https: true,
  under_maintenance_since: null,
});
```

### `deleteTenant(fqdn)`

Deletes a tenant hostname record, closes the tenant connection, drops the tenant database, and removes the hostname from the in-memory cache.

```js
await deleteTenant("customer-a.example.com");
```

Use this carefully. It removes the tenant database.

## Recommended Application Structure

A typical consuming application should look similar to this:

```text
your-app/
  database/
    migrations/
      tenants/
    models/
      index.js
      hostname.js
      user.js
    seeders/
  tenants/
    tenancy.ts
  src/
    app.js
```

Recommended responsibilities:

- Keep shared/default models, such as the hostname model, listed under `models-shared`.
- Keep tenant-specific models out of `models-shared` so they are loaded per tenant database.
- Keep tenant migrations under `database/migrations/tenants` after installation.
- Initialize tenancy before accepting traffic.
- Emit `requestUrl` once per request before reading or writing tenant data.

## Best Practices For Reliable Results

### Initialize Once

Call `init()` once during application startup. Avoid calling it in every request handler.

### Emit The Host Before Data Access

Any route that calls tenant-aware methods must emit the current host first.

```js
global.em.emit("requestUrl", req.headers.host);
```

### Treat The Default Host Separately

Set `TENANCY_DEFAULT_HOSTNAME` for the hostname that should use the default database.

```env
TENANCY_DEFAULT_HOSTNAME=sample.dev
```

### Use Explicit Service Instances For Tests And Workers

For tests, queues, cron jobs, and worker processes, prefer `TenantService` with an explicit config and event emitter. This avoids hidden global state and makes behavior easier to reason about.

### Keep Tenant Setup Commands Away From Production Accidents

Commands like `tenancy:install`, `deleteTenant`, and `truncate` can remove data. Run them only when you mean to change or remove data, and make sure backups exist for important environments.

### Use Audit Logging Deliberately

Turn on `TENANCY_AUDIT_LOG=true` only when your tenant databases have the expected audits model/table and your records use `id` as the primary key.

### Prefer Model Methods For User Input

Use `create`, `update`, `findAll`, `findFirst`, and `findById` for normal application work. Reserve `executeQuery` for trusted SQL.

## Example Express Integration

```js
const express = require("express");
const { EventEmitter } = require("events");
const { init, findAll, create, createTenant } = require("node-multi-tenant");

global.em = new EventEmitter();

async function main() {
  await init();

  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    global.em.emit("requestUrl", req.headers.host);
    next();
  });

  app.get("/users", async (req, res, next) => {
    try {
      const users = await findAll("Users");
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.post("/users", async (req, res, next) => {
    try {
      const user = await create("Users", req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  app.post("/tenants", async (req, res, next) => {
    try {
      const tenant = await createTenant(req.body.fqdn);
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  });

  app.listen(3000, () => {
    console.log("Application listening on port 3000");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## Troubleshooting

### Tenant Data Is Coming From The Wrong Database

Check that your app emits `requestUrl` before calling tenant-aware methods.

```js
global.em.emit("requestUrl", req.headers.host);
```

Also confirm `TENANCY_DEFAULT_HOSTNAME` is set correctly.

### The Package Cannot Find Models Or Migrations

Check `tenants/tenancy.ts`. The folder paths are resolved from your application root.

### The Package Cannot Find The Default Database Context

Check `datastore.dbconfigfile`. It should point to the module that exports your Sequelize database context, usually `database/models/index`.

### CLI Commands Do Not Run

Make sure `sequelize-cli` is installed and available in `node_modules/.bin/sequelize` in your application.

### Audit Logs Are Not Written

Check that `TENANCY_AUDIT_LOG=true`, the audits model/table exists in tenant databases, and records use an `id` primary key.

## Development

For package contributors:

```sh
npm install
npm run build
npm test
npm run coverage
```

Current test coverage is above 80% across the primary metrics.

## Credits

This project was inspired by the Laravel Tenancy ecosystem and by repository patterns from `node-repositories`.

Original multi-tenant application design reference: https://blog.lftechnology.com/designing-a-secure-and-scalable-multi-tenant-application-on-node-js-15ae13dda778

## License

ISC
