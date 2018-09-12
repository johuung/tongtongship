'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    cookieName: DataTypes.STRING,
    url: DataTypes.STRING,
    time: DataTypes.STRING
  }, {});
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};