'use strict';
module.exports = (sequelize, DataTypes) => {
  const CallUser = sequelize.define('CallUser', {
    cookie: {
      type: DataTypes.STRING,
      primaryKey: true
    },
  }, {});
  CallUser.associate = function(models) {
    // associations can be defined here
  };
  return CallUser;
};
