
// controllers/chatController.js
const { ChatSession, Message, User } = require('../models');
const { asyncHandler, generateSessionTitle } = require('../utils/helpers');
const GeminiService = require('../services/geminiService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// @desc    Get all chat sessions for user
// @route   GET /api/chat/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const sessions = await ChatSession.findAndCountAll({
    where: {
      userId: req.user.id,
      isArchived: false
    },
    order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        association: 'messages',
        attributes: ['role', 'content'],
        limit: 1,
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  res.json({
    success: true,
    data: {
      sessions: sessions.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sessions.count,
        pages: Math.ceil(sessions.count / limit)
      }
    }
  });
});

// @desc    Get specific chat session with messages
// @route   GET /api/chat/sessions/:sessionId
// @access  Private
const getSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const session = await ChatSession.findOne({
    where: {
      id: sessionId,
      userId: req.user.id,
      isArchived: false
    },
    include: [
      {
        association: 'messages',
        where: { isVisible: true },
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    ]
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Chat session not found'
    });
  }

  res.json({
    success: true,
    data: { session }
  });
});

// @desc    Create new chat session
// @route   POST /api/chat/sessions
// @access  Private
const createSession = asyncHandler(async (req, res) => {
  const { title } = req.body;

  const session = await ChatSession.create({
    userId: req.user.id,
    title: title || 'New Chat'
  });

  logger.info('New chat session created', {
    userId: req.user.id,
    sessionId: session.id
  });

  res.status(201).json({
    success: true,
    message: 'Chat session created',
    data: { session }
  });
});

// @desc    Send message in chat session
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { sessionId, content, attachments = [] } = req.body;

  let session;

  // If no sessionId provided, create a new session
  if (!sessionId) {
    const title = generateSessionTitle(content);
    session = await ChatSession.create({
      userId: req.user.id,
      title
    });
  } else {
    // Find existing session
    session = await ChatSession.findOne({
      where: {
        id: sessionId,
        userId: req.user.id,
        isArchived: false
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
  }

  // Create user message
  const userMessage = await Message.create({
    sessionId: session.id,
    userId: req.user.id,
    role: 'user',
    content,
    attachments
  });

  // Get recent message history for context (last 20 messages)
  const recentMessages = await Message.findAll({
    where: {
      sessionId: session.id,
      isVisible: true
    },
    order: [['createdAt', 'ASC']],
    limit: 20
  });

  try {
    // Generate AI response using Gemini
    const aiResponse = await GeminiService.generateResponse(
      recentMessages.map(m => ({
        role: m.role,
        content: m.content
      })),
      req.user.id
    );

    // Create assistant message
    const assistantMessage = await Message.create({
      sessionId: session.id,
      userId: req.user.id,
      role: 'assistant',
      content: aiResponse.content,
      tokens: aiResponse.tokens,
      metadata: aiResponse.metadata
    });

    // Update session
    await session.update({
      lastMessageAt: new Date(),
      messageCount: session.messageCount + 2,
      title: session.messageCount === 0 ? generateSessionTitle(content) : session.title
    });

    // If this is the first exchange and we need to generate a better title
    if (session.messageCount === 2 && session.title === 'New Chat') {
      try {
        const generatedTitle = await GeminiService.generateTitle(recentMessages);
        await session.update({ title: generatedTitle });
      } catch (error) {
        logger.warn('Failed to generate session title', { sessionId: session.id });
      }
    }

    logger.info('Message exchange completed', {
      userId: req.user.id,
      sessionId: session.id,
      messageCount: 2
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title
        },
        messages: [userMessage, assistantMessage]
      }
    });

  } catch (error) {
    logger.error('Failed to generate AI response', {
      userId: req.user.id,
      sessionId: session.id,
      error: error.message
    });

    // Create error message
    const errorMessage = await Message.create({
      sessionId: session.id,
      userId: req.user.id,
      role: 'assistant',
      content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      metadata: { error: true, timestamp: new Date() }
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title
        },
        messages: [userMessage, errorMessage]
      }
    });
  }
});

// @desc    Delete chat session
// @route   DELETE /api/chat/sessions/:sessionId
// @access  Private
const deleteSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await ChatSession.findOne({
    where: {
      id: sessionId,
      userId: req.user.id
    }
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Chat session not found'
    });
  }

  // Soft delete - mark as inactive
  await session.update({ isArchived: true });

  // Also hide all messages in this session
  await Message.update(
    { isVisible: false },
    { where: { sessionId } }
  );

  logger.info('Chat session deleted', {
    userId: req.user.id,
    sessionId
  });

  res.json({
    success: true,
    message: 'Chat session deleted'
  });
});

// @desc    Update chat session title
// @route   PUT /api/chat/sessions/:sessionId
// @access  Private
const updateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { title } = req.body;

  const session = await ChatSession.findOne({
    where: {
      id: sessionId,
      userId: req.user.id,
      isArchived: false
    }
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Chat session not found'
    });
  }

  await session.update({ title });

  res.json({
    success: true,
    message: 'Session updated',
    data: { session }
  });
});

// @desc    Clear all chat sessions
// @route   DELETE /api/chat/sessions
// @access  Private
const clearAllSessions = asyncHandler(async (req, res) => {
  await ChatSession.update(
    { isArchived: true },
    { where: { userId: req.user.id } }
  );

  await Message.update(
    { isVisible: false },
    { where: { userId: req.user.id } }
  );

  logger.info('All chat sessions cleared', {
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'All chat sessions cleared'
  });
});

module.exports = {
  getSessions,
  getSession,
  createSession,
  sendMessage,
  deleteSession,
  updateSession,
  clearAllSessions
};