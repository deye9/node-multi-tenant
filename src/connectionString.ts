import Sequelize = require("sequelize");

export function buildConnectionString(
  sequelize: Sequelize.Sequelize,
  databaseName?: string,
): string {
  const connection = sequelize as any;
  const config = connection.config as Sequelize.Config & {
    port?: string | number;
  };
  const dialect = connection.options.dialect;
  const database = databaseName || config.database;
  const password = config.password || "";
  return `${dialect}://${config.username}:${password}@${config.host}:${config.port}/${database}`;
}
