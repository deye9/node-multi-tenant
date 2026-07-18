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
  const username = encodeURIComponent(config.username || "");
  const encodedPassword = encodeURIComponent(password);
  const encodedDatabase = encodeURIComponent(database || "");
  const port = config.port ? `:${config.port}` : "";

  return `${dialect}://${username}:${encodedPassword}@${config.host}${port}/${encodedDatabase}`;
}
