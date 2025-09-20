// controllers/authController.js
const { User } = require('../models');
const { generateToken, generateResetToken, generateOTP } = require('../utils/tokenUtils');
const { asyncHandler } = require('../utils/helpers');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`
  });

  // Generate token
  const token = generateToken({ userId: user.id });

  // Send welcome notifications
  await NotificationService.sendWelcomeNotification(user);

  logger.info('New user registered', {
    userId: user.id,
    email: user.email
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for validation
  const user = await User.findOne({ 
    where: { email, status: 'active' }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Validate password
  const isValidPassword = await user.validatePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  await user.update({ lastLoginAt: new Date() });

  // Generate token
  const token = generateToken({ userId: user.id });

  logger.info('User logged in', {
    userId: user.id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        association: 'notifications',
        where: { isRead: false },
        required: false
      }
    ]
  });

  res.json({
    success: true,
    data: {
      user,
      unreadNotifications: user.notifications?.length || 0
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar, settings } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (settings) updateData.settings = settings;
  
  // Handle avatar update
  if (avatar) {
    // If avatar is a file URL (starts with /uploads/), store it directly
    if (avatar.startsWith('/uploads/')) {
      updateData.avatar = avatar;
    } else {
      // If it's still base64 data, store it as is (for backward compatibility)
      updateData.avatar = avatar;
    }
  }

  await req.user.update(updateData);

  logger.info('User profile updated', {
    userId: req.user.id,
    fieldsUpdated: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: req.user }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Debug logging
  console.log('Change password request body:', req.body);
  console.log('Current password:', currentPassword);
  console.log('New password:', newPassword);

  // Validate required fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
      received: {
        currentPassword: !!currentPassword,
        newPassword: !!newPassword,
        body: req.body
      }
    });
  }

  // Validate new password length
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  // Fetch user with password field for validation
  const user = await User.findByPk(req.user.id, {
    attributes: { include: ['password'] }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Validate current password
  const isValidPassword = await user.validatePassword(currentPassword);
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  await user.update({ password: newPassword });

  logger.info('User password changed', {
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email, status: 'active' } });
  if (!user) {
    // Return success even if user doesn't exist (security)
    return res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent'
    });
  }

  // Generate OTP and reset token
  const otp = generateOTP(6);
  const resetToken = generateResetToken();
  const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for OTP

  await user.update({
    resetPasswordToken: resetToken,
    resetPasswordExpires: resetExpires
  });

  // Send OTP email
  const emailResult = await EmailService.sendOTPEmail(user, otp);

  logger.info('Password reset requested', {
    userId: user.id,
    email: user.email,
    emailSent: emailResult.success,
    otp: otp,
    resetToken: resetToken
  });

  // Provide different messages based on email configuration
  let message = 'If an account with that email exists, an OTP has been sent';
  if (!emailResult.success) {
    message = 'Password reset OTP generated but email could not be sent. Please contact support.';
  } else if (emailResult.note) {
    message = 'Password reset OTP generated. Check server logs for email content.';
  }

  res.json({
    success: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      otp: otp,
      resetToken: resetToken,
      emailResult: emailResult 
    })
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() },
      status: 'active'
    }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Update password and clear reset fields
  await user.update({
    password: newPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null
  });

  logger.info('Password reset completed', {
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};