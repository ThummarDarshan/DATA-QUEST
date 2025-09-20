
// models/index.js - Model associations
const User = require('./User.js');
const ChatSession = require('./ChatSession.js');
const Message = require('./Message.js');
const UserSettings = require('./UserSettings.js');
const Notification = require('./Notification.js');

// Define associations
User.hasMany(ChatSession, { foreignKey: 'userId', as: 'chatSessions' });
ChatSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ChatSession.hasMany(Message, { foreignKey: 'sessionId', as: 'messages' });
Message.belongsTo(ChatSession, { foreignKey: 'sessionId', as: 'session' });

User.hasMany(UserSettings, { foreignKey: 'userId', as: 'userSettings' });
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  ChatSession,
  Message,
  UserSettings,
  Notification
};