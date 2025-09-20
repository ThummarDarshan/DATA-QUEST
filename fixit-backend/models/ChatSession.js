
// models/ChatSession.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'New Chat'
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_archived'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'message_count'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'chat_sessions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_archived'] },
    { fields: ['last_message_at'] },
    { fields: ['user_id', 'is_archived'] }
  ]
});

module.exports = ChatSession;