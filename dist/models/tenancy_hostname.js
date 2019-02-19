'use strict';
module.exports = (sequelize, DataTypes) => {
  const hostname = sequelize.define('hostname', {
    fqdn: DataTypes.STRING,
    redirect_to: DataTypes.STRING,
    force_https: DataTypes.BOOLEAN,
    under_maintenance_since: DataTypes.DATE,
    uuid: DataTypes.UUID,
  }, {});
  hostname.associate = function(models) {
    // associations can be defined here
  };
  
  //hostname.BelongsTo(website, {as: 'hostnames_website_id_foreign', through: 'website_id', foreignKey: 'id' });

  return hostname;
};