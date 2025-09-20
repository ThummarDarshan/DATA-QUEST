
// services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Check if email configuration is available
    this.isConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      logger.info('Email service configured', {
        host: process.env.EMAIL_HOST,
        user: process.env.EMAIL_USER
      });
    } else {
      logger.warn('Email service not configured - emails will be logged instead of sent');
    }
  }

  async sendEmail(to, subject, html, text) {
    try {
      if (!this.isConfigured) {
        // Log email content instead of sending when not configured
        logger.info('Email would be sent (service not configured)', {
          to,
          subject,
          html: html.substring(0, 200) + '...',
          text: text.substring(0, 200) + '...'
        });
        
        return { 
          success: true, 
          messageId: 'logged-' + Date.now(),
          note: 'Email logged instead of sent (service not configured)'
        };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email sending failed', {
        to,
        subject,
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Fixit AI!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Fixit AI, ${user.name}!</h2>
        <p>Thank you for joining our AI-powered chat platform. You're now ready to:</p>
        <ul>
          <li>Chat with our advanced AI assistant</li>
          <li>Get help with any questions or tasks</li>
          <li>Explore intelligent conversations</li>
        </ul>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;"><strong>Getting Started:</strong></p>
          <p style="margin: 5px 0;">Simply start a new chat and ask me anything!</p>
        </div>
        <p>Best regards,<br>The Fixit AI Team</p>
      </div>
    `;
    
    const text = `Welcome to Fixit AI, ${user.name}! Thank you for joining our platform. You can now chat with our AI assistant and get help with any questions.`;
    
    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your Fixit AI account.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>The Fixit AI Team</p>
      </div>
    `;
    
    const text = `Password reset requested for ${user.email}. Reset link: ${resetUrl} (expires in 1 hour)`;
    
    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendChatNotification(user, sessionTitle, messagePreview) {
    const subject = `New message in: ${sessionTitle}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Chat Activity</h2>
        <p>Hello ${user.name},</p>
        <p>There's new activity in your chat session: <strong>${sessionTitle}</strong></p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 6px;">
          <p style="margin: 0; color: #64748b;">${messagePreview}</p>
        </div>
        <p><a href="${process.env.FRONTEND_URL}" style="color: #3b82f6;">Continue the conversation</a></p>
        <p>Best regards,<br>The Fixit AI Team</p>
      </div>
    `;
    
    const text = `New message in ${sessionTitle}: ${messagePreview}`;
    
    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendOTPEmail(user, otp) {
    const subject = 'Password Reset OTP - Fixit AI';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset OTP</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your Fixit AI account.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
          <h1 style="color: #3b82f6; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p><strong>Use this OTP to reset your password.</strong></p>
        <p>This OTP will expire in 10 minutes. If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>The Fixit AI Team</p>
      </div>
    `;
    
    const text = `Password reset OTP for ${user.email}: ${otp} (expires in 10 minutes)`;
    
    return await this.sendEmail(user.email, subject, html, text);
  }
}

module.exports = new EmailService();