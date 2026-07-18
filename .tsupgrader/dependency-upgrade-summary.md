# Dependency Upgrade Summary

Session: 638ae4a3-e557-4b78-9596-b9e62ce2b5f6

Updated runtime dependencies:

- auto-bind: 2.1.1 -> 5.0.1
- dotenv: 6.2.0 -> 17.4.2
- pg: 7.12.1 -> 8.22.0
- sequelize: 5.19.6 -> 6.37.8
- sequelize-cli: 5.5.1 -> 6.6.5

Updated dev dependencies:

- @types/node: 12.20.55 -> 26.1.1
- TypeScript compiler: typescript 4.9.5 -> 6.0.3
- chai: 4.2.0 -> 6.2.2
- chai-as-promised: 7.1.1 -> 8.0.2
- chai-http: 4.3.0 -> 5.1.2
- eslint: 5.16.0 -> 8.57.1 (latest compatible with eslint-config-airbnb-base 15 and standard 17)
- eslint-config-airbnb-base: 13.2.0 -> 15.0.0
- eslint-plugin-import: 2.18.2 -> 2.32.0
- jest: 24.9.0 -> 30.4.2
- mocha: 5.2.0 -> 11.7.6
- nyc: 13.1.0 -> 18.0.0
- sinon: 7.5.0 -> 22.0.0
- standard: 12.0.1 -> 17.1.2

Notable edits:

- Replaced removed Sequelize v5 sequelize.import usage with direct CommonJS model factory loading.
- Kept TypeScript build commands on the standard tsc compiler.
- Updated tsconfig to node16 module resolution and explicit Node ambient types for TS 6.
- Updated the context registry test fixture to match the Sequelize 6-compatible loader.

Validation:

- npm run build: passed
- npx tsc --noEmit: passed
- package main assertion: passed
- npm test: 40 passing, coverage 95.86% statements / 90.30% branches / 91.26% functions / 96.88% lines

Notes:

- npm audit currently reports 6 vulnerabilities (1 low, 4 moderate, 1 high). No audit remediation was performed as part of this dependency-version update.
