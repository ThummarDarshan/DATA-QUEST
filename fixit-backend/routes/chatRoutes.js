
// routes/chatRoutes.js
const express = require('express');
const {
  getSessions,
  getSession,
  createSession,
  sendMessage,
  deleteSession,
  updateSession,
  clearAllSessions
} = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { validate, chatValidations } = require('../middleware/validation');
const { chatLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// Session routes
router.get('/sessions', getSessions);
router.post('/sessions', validate(chatValidations.createSession), createSession);
router.get('/sessions/:sessionId', getSession);
router.put('/sessions/:sessionId', updateSession);
router.delete('/sessions/:sessionId', deleteSession);
router.delete('/sessions', clearAllSessions);

// Message routes
router.get('/sessions/:sessionId/messages', getSession);
router.post('/messages', chatLimiter, validate(chatValidations.sendMessage), sendMessage);

module.exports = router;