
// services/notificationService.js
const { Notification } = require('../models');
const EmailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  async createNotification(userId, type, title, message, metadata = {}) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        metadata
      });

      logger.info('Notification created', {
        userId,
        type,
        notificationId: notification.id
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', {
        userId,
        type,
        error: error.message
      });
      throw error;
    }
  }

  async sendWelcomeNotification(user) {
    // Create system notification
    await this.createNotification(
      user.id,
      'system',
      'Welcome to Fixit AI!',
      'Your account has been created successfully. Start chatting with our AI assistant now!',
      { category: 'welcome' }
    );

    // Send welcome email if user has email notifications enabled
    if (user.settings?.notifications?.email) {
      await EmailService.sendWelcomeEmail(user);
    }
  }

  async sendChatNotification(userId, sessionTitle, messageContent) {
    // Create notification
    await this.createNotification(
      userId,
      'chat',
      `New message in: ${sessionTitle}`,
      messageContent.substring(0, 200) + (messageContent.length > 200 ? '...' : ''),
      { sessionTitle }
    );
  }

  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const notifications = await Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to fetch notifications', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const [updatedRows] = await Notification.update(
        { isRead: true },
        { where: { id: notificationId, userId } }
      );

      return updatedRows > 0;
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        notificationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { userId, isRead: false }
      });

      return count;
    } catch (error) {
      logger.error('Failed to get unread count', {
        userId,
        error: error.message
      });
      return 0;
    }
  }
}

module.exports = new NotificationService();