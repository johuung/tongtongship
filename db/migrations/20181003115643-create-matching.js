'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Matchings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      host: {
        type: Sequelize.STRING,
    		defaultValue: null,
    		references: {
          model: 'LobbyUsers',
          key: 'cookie'
        },
    		onUpdate: 'CASCADE',
    		onDelete: 'CASCADE'
      },
      guest: {
        type: Sequelize.STRING,
    		defaultValue: null,
    		references: {
          model: 'LobbyUsers',
          key: 'cookie'
        },
    		onUpdate: 'CASCADE',
    		onDelete: 'CASCADE'
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
    return queryInterface.dropTable('Matchings');
  }
};
