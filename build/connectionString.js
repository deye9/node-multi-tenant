"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConnectionString = buildConnectionString;
function buildConnectionString(sequelize, databaseName) {
    const connection = sequelize;
    const config = connection.config;
    const dialect = connection.options.dialect;
    const database = databaseName || config.database;
    const password = config.password || "";
    const username = encodeURIComponent(config.username || "");
    const encodedPassword = encodeURIComponent(password);
    const encodedDatabase = encodeURIComponent(database || "");
    const port = config.port ? `:${config.port}` : "";
    return `${dialect}://${username}:${encodedPassword}@${config.host}${port}/${encodedDatabase}`;
}
