'use strict';
module.exports = (sequelize, DataTypes) => {
  const LobbyUser = sequelize.define('LobbyUser', {
    cookie: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    url: DataTypes.STRING,
    status: DataTypes.ENUM('idle', 'busy')
  }, {});
  LobbyUser.associate = function(models) {
    // associations can be defined here
  };
  return LobbyUser;
};
