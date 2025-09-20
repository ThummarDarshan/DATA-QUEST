const pineconeService = require('../services/pineconeService');
const logger = require('./logger');

/**
 * Utility functions for Pinecone vector operations
 */
class PineconeUtils {
    
    /**
     * Generate a unique ID for vectors
     */
    static generateVectorId(prefix = 'vec', timestamp = null) {
        const ts = timestamp || Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${ts}_${random}`;
    }

    /**
     * Prepare chat message for vector storage
     */
    static prepareMessageVector(message, userId, chatSessionId, metadata = {}) {
        return {
            id: this.generateVectorId('msg'),
            values: message.embedding || [], // Assuming embedding is already generated
            metadata: {
                userId,
                chatSessionId,
                messageId: message.id,
                content: message.content,
                role: message.role || 'user',
                timestamp: message.createdAt || new Date().toISOString(),
                ...metadata
            }
        };
    }

    /**
     * Prepare document for vector storage
     */
    static prepareDocumentVector(document, userId, metadata = {}) {
        return {
            id: this.generateVectorId('doc'),
            values: document.embedding || [],
            metadata: {
                userId,
                documentId: document.id,
                title: document.title || '',
                content: document.content,
                type: document.type || 'document',
                timestamp: document.createdAt || new Date().toISOString(),
                ...metadata
            }
        };
    }

    /**
     * Store chat message vectors
     */
    static async storeMessageVectors(messages, userId, chatSessionId) {
        try {
            if (!pineconeService.isReady()) {
                await pineconeService.initialize();
            }

            const vectors = messages.map(message => 
                this.prepareMessageVector(message, userId, chatSessionId)
            );

            const result = await pineconeService.upsertVectors(vectors);
            logger.info(`Stored ${vectors.length} message vectors for user ${userId}`);
            return result;

        } catch (error) {
            logger.error('Failed to store message vectors:', error);
            throw error;
        }
    }

    /**
     * Search for similar messages
     */
    static async searchSimilarMessages(queryVector, userId, chatSessionId = null, topK = 5) {
        try {
            if (!pineconeService.isReady()) {
                await pineconeService.initialize();
            }

            const filter = {
                userId: { $eq: userId }
            };

            if (chatSessionId) {
                filter.chatSessionId = { $eq: chatSessionId };
            }

            const result = await pineconeService.queryVectors(queryVector, topK, true);
            
            // Filter results by metadata
            const filteredMatches = result.matches.filter(match => {
                const metadata = match.metadata;
                return metadata.userId === userId && 
                       (!chatSessionId || metadata.chatSessionId === chatSessionId);
            });

            return {
                ...result,
                matches: filteredMatches
            };

        } catch (error) {
            logger.error('Failed to search similar messages:', error);
            throw error;
        }
    }

    /**
     * Search for similar documents
     */
    static async searchSimilarDocuments(queryVector, userId, topK = 5) {
        try {
            if (!pineconeService.isReady()) {
                await pineconeService.initialize();
            }

            const filter = {
                userId: { $eq: userId },
                type: { $eq: 'document' }
            };

            const result = await pineconeService.queryVectors(queryVector, topK, true);
            
            // Filter results by metadata
            const filteredMatches = result.matches.filter(match => {
                const metadata = match.metadata;
                return metadata.userId === userId && metadata.type === 'document';
            });

            return {
                ...result,
                matches: filteredMatches
            };

        } catch (error) {
            logger.error('Failed to search similar documents:', error);
            throw error;
        }
    }

    /**
     * Delete vectors by chat session
     */
    static async deleteChatSessionVectors(chatSessionId, userId) {
        try {
            if (!pineconeService.isReady()) {
                await pineconeService.initialize();
            }

            // First, query to find all vectors for this chat session
            const queryResult = await pineconeService.queryVectors(
                new Array(1536).fill(0), // Dummy vector for query
                10000, // Large number to get all matches
                true
            );

            const vectorsToDelete = queryResult.matches
                .filter(match => {
                    const metadata = match.metadata;
                    return metadata.userId === userId && 
                           metadata.chatSessionId === chatSessionId;
                })
                .map(match => match.id);

            if (vectorsToDelete.length > 0) {
                await pineconeService.deleteVectors(vectorsToDelete);
                logger.info(`Deleted ${vectorsToDelete.length} vectors for chat session ${chatSessionId}`);
            }

            return vectorsToDelete.length;

        } catch (error) {
            logger.error('Failed to delete chat session vectors:', error);
            throw error;
        }
    }

    /**
     * Get vector statistics for a user
     */
    static async getUserVectorStats(userId) {
        try {
            if (!pineconeService.isReady()) {
                await pineconeService.initialize();
            }

            const stats = await pineconeService.getIndexStats();
            
            // Note: This is a basic implementation
            // In a production environment, you might want to store user-specific stats
            // or implement more sophisticated filtering
            
            return {
                totalVectors: stats.totalVectorCount || 0,
                dimension: stats.dimension || 1536,
                indexFullness: stats.indexFullness || 0
            };

        } catch (error) {
            logger.error('Failed to get user vector stats:', error);
            throw error;
        }
    }

    /**
     * Initialize Pinecone service with proper error handling
     */
    static async initializeService() {
        try {
            await pineconeService.initialize();
            logger.info('Pinecone service initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Pinecone service:', error);
            return false;
        }
    }

    /**
     * Check if Pinecone service is available
     */
    static isServiceAvailable() {
        return pineconeService.isReady();
    }
}

module.exports = PineconeUtils;
