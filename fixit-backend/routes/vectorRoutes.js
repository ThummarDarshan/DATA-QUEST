const express = require('express');
const router = express.Router();
const VectorController = require('../controllers/vectorController');
const auth = require('../middleware/auth');

/**
 * Vector Routes for Pinecone operations
 * All routes require authentication
 */

// Initialize Pinecone service
router.post('/initialize', auth, VectorController.initialize);

// Get service status
router.get('/status', auth, VectorController.getStatus);

// Get index statistics
router.get('/stats', auth, VectorController.getStats);

// Search for similar vectors
router.post('/search', auth, VectorController.search);

// Store vectors
router.post('/store', auth, VectorController.store);

module.exports = router;
