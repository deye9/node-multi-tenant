'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('audits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_type: {
        type: Sequelize.STRING(191)
      },
      user_id: {
        type: Sequelize.BIGINT
      },
      event: {
        allowNull: false,
        type: Sequelize.STRING(191)
      },
      model: {
        allowNull: false,
        type: Sequelize.STRING(191)
      },
      record_id: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      old_values: {
        type: Sequelize.TEXT
      },
      new_values: {
        type: Sequelize.TEXT
      },
      url: {
        type: Sequelize.TEXT
      },
      ip_address: {
        type: Sequelize.TEXT
      },
      user_agent: {
        type: Sequelize.TEXT
      },
      tags: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('audits');
  }
};