'use strict';
module.exports = (sequelize, DataTypes) => {
  const LobbyUser = sequelize.define('LobbyUser', {
    cookie: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    url: DataTypes.STRING,
    state: {
      type: DataTypes.ENUM,
      values: ['idle', 'busy']
    }
  }, {});
  LobbyUser.associate = function(models) {
    // associations can be defined here
  };
  return LobbyUser;
};
