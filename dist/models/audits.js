'use strict'

module.exports = (sequelize, DataTypes) => {
  const audits = sequelize.define('audits', {
    user_type: DataTypes.STRING(191),
    user_id: DataTypes.BIGINT,
    event: DataTypes.STRING(191),
    model: DataTypes.STRING(191),
    record_id: DataTypes.BIGINT,
    old_values: DataTypes.TEXT,
    new_values: DataTypes.TEXT,
    url: DataTypes.TEXT,
    ip_address: DataTypes.TEXT,
    user_agent: DataTypes.TEXT,
    tags: DataTypes.TEXT
  }, {})
  audits.associate = function (models) {
    // associations can be defined here
  }
  return audits
}
