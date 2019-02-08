'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hostnames', {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      fqdn: {
        unique: true,
        allowNull: false,
        type: Sequelize.STRING
      },
      redirect_to: {
        type: Sequelize.STRING
      },      
      force_https: {
        type: Sequelize.BOOLEAN
      },      
      under_maintenance_since: {
        type: Sequelize.DATE
      },
      website_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('hostnames');
  }
};