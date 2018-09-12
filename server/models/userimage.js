'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserImage = sequelize.define('UserImage', {
      cookie: {type: DataTypes.STRING, primaryKey: true},
      url: DataTypes.STRING,
      guest1: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest2: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest3: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest4: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest5: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest6: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest7: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest8: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}},
      guest9: {type: DataTypes.STRING, defaultValue: null, references: {model: this, key: 'cookie'}}
      
  }, {});
  UserImage.associate = function(models) {
    // associations can be defined here
  };
  return UserImage;
};
