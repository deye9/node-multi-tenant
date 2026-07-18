"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConnectionString = buildConnectionString;
function buildConnectionString(sequelize, databaseName) {
    const connection = sequelize;
    const config = connection.config;
    const dialect = connection.options.dialect;
    const database = databaseName || config.database;
    const password = config.password || "";
    return `${dialect}://${config.username}:${password}@${config.host}:${config.port}/${database}`;
}
