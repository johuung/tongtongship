'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('LobbyUsers', {
      cookie: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.ENUM('idle', 'busy'),
        defaultValue: 'idle',
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('LobbyUsers');
  }
};
