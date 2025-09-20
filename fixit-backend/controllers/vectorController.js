const pineconeService = require('../services/pineconeService');
const PineconeUtils = require('../utils/pineconeUtils');
const logger = require('../utils/logger');

/**
 * Vector Controller for Pinecone operations
 * This is a basic setup - you can extend this based on your needs
 */
class VectorController {
    
    /**
     * Initialize Pinecone service
     */
    static async initialize(req, res) {
        try {
            const isInitialized = await PineconeUtils.initializeService();
            
            if (isInitialized) {
                res.json({
                    success: true,
                    message: 'Pinecone service initialized successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to initialize Pinecone service'
                });
            }
        } catch (error) {
            logger.error('Vector controller initialization error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get service status
     */
    static async getStatus(req, res) {
        try {
            const isAvailable = PineconeUtils.isServiceAvailable();
            
            res.json({
                success: true,
                available: isAvailable,
                message: isAvailable ? 'Pinecone service is ready' : 'Pinecone service is not available'
            });
        } catch (error) {
            logger.error('Vector controller status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get index statistics
     */
    static async getStats(req, res) {
        try {
            if (!PineconeUtils.isServiceAvailable()) {
                return res.status(503).json({
                    success: false,
                    message: 'Pinecone service is not available'
                });
            }

            const stats = await PineconeUtils.getUserVectorStats(req.user.id);
            
            res.json({
                success: true,
                stats: stats
            });
        } catch (error) {
            logger.error('Vector controller stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Search for similar vectors
     */
    static async search(req, res) {
        try {
            const { queryVector, topK = 5, type = 'message' } = req.body;
            const userId = req.user.id;

            if (!queryVector || !Array.isArray(queryVector)) {
                return res.status(400).json({
                    success: false,
                    message: 'Query vector is required and must be an array'
                });
            }

            if (!PineconeUtils.isServiceAvailable()) {
                return res.status(503).json({
                    success: false,
                    message: 'Pinecone service is not available'
                });
            }

            let results;
            if (type === 'document') {
                results = await PineconeUtils.searchSimilarDocuments(queryVector, userId, topK);
            } else {
                results = await PineconeUtils.searchSimilarMessages(queryVector, userId, null, topK);
            }

            res.json({
                success: true,
                results: results.matches,
                count: results.matches.length
            });
        } catch (error) {
            logger.error('Vector controller search error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Store vectors (example endpoint)
     */
    static async store(req, res) {
        try {
            const { vectors } = req.body;
            const userId = req.user.id;

            if (!vectors || !Array.isArray(vectors)) {
                return res.status(400).json({
                    success: false,
                    message: 'Vectors array is required'
                });
            }

            if (!PineconeUtils.isServiceAvailable()) {
                return res.status(503).json({
                    success: false,
                    message: 'Pinecone service is not available'
                });
            }

            // Add user ID to each vector metadata
            const userVectors = vectors.map(vector => ({
                ...vector,
                metadata: {
                    ...vector.metadata,
                    userId: userId
                }
            }));

            const result = await pineconeService.upsertVectors(userVectors);

            res.json({
                success: true,
                message: `Stored ${vectors.length} vectors successfully`,
                result: result
            });
        } catch (error) {
            logger.error('Vector controller store error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = VectorController;
