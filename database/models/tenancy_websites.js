'use strict';
module.exports = (sequelize, DataTypes) => {
  const website = sequelize.define('websites', {
    uuid: DataTypes.UUID,
  }, {});
  website.associate = function(models) {
    // associations can be defined here
  };
  return website;
};