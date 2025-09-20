// routes/notificationRoutes.js
const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();
router.use(authenticateToken);

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const notifications = await NotificationService.getUserNotifications(
    req.user.id,
    parseInt(limit),
    parseInt(offset)
  );

  res.json({
    success: true,
    data: { notifications }
  });
}));

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await NotificationService.getUnreadCount(req.user.id);
  
  res.json({
    success: true,
    data: { count }
  });
}));

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', asyncHandler(async (req, res) => {
  const success = await NotificationService.markAsRead(req.params.id, req.user.id);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

module.exports = router;