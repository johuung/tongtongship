'use strict';
module.exports = (sequelize, DataTypes) => {
  const Matching = sequelize.define('Matching', {
    host: {
      type: DataTypes.STRING,
      references: {
        model: 'LobbyUser',
        key: 'cookie'
      }
    },
    guest: {
      type: DataTypes.STRING,
      references: {
        model: 'LobbyUser',
        key: 'cookie'
      }
    }
  }, {});
  Matching.associate = function(models) {
    // associations can be defined here
  };
  return Matching;
};
