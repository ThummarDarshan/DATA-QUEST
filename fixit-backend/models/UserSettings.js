
// models/UserSettings.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSettings = sequelize.define('UserSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'user_settings',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['category'] },
    { fields: ['user_id', 'category'], unique: true }
  ]
});

module.exports = UserSettings;