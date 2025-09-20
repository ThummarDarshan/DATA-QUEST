const express = require('express');
const router = express.Router();
const VectorController = require('../controllers/vectorController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Vector Routes for Pinecone operations
 * All routes require authentication
 */

// Initialize Pinecone service
router.post('/initialize', authenticateToken, VectorController.initialize);

// Get service status
router.get('/status', authenticateToken, VectorController.getStatus);

// Get index statistics
router.get('/stats', authenticateToken, VectorController.getStats);

// Search for similar vectors
router.post('/search', authenticateToken, VectorController.search);

// Store vectors
router.post('/store', authenticateToken, VectorController.store);

module.exports = router;
