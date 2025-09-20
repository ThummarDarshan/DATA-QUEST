const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../utils/logger');

class PineconeService {
    constructor() {
        this.pinecone = null;
        this.index = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Pinecone connection
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return this.pinecone;
            }

            const apiKey = process.env.PINECONE_API_KEY;
            const environment = process.env.PINECONE_ENVIRONMENT;
            const projectId = process.env.PINECONE_PROJECT_ID;
            const indexName = process.env.PINECONE_INDEX_NAME || 'fixit-chat-index';

            if (!apiKey || !environment) {
                throw new Error('Pinecone API key and environment are required');
            }

            // Initialize Pinecone client
            this.pinecone = new Pinecone({
                apiKey: apiKey,
                environment: environment
            });

            // Get the index
            this.index = this.pinecone.index(indexName);
            this.isInitialized = true;

            logger.info('Pinecone service initialized successfully');
            return this.pinecone;

        } catch (error) {
            logger.error('Failed to initialize Pinecone service:', error);
            throw error;
        }
    }

    /**
     * Create a new index if it doesn't exist
     */
    async createIndex(indexName = 'fixit-chat-index', dimension = 1536) {
        try {
            await this.initialize();
            
            // List existing indexes
            const indexesResponse = await this.pinecone.listIndexes();
            const existingIndexes = indexesResponse.indexes || [];
            const indexExists = existingIndexes.some(index => index.name === indexName);

            if (!indexExists) {
                // Try to create a basic index first
                try {
                    await this.pinecone.createIndex({
                        name: indexName,
                        dimension: dimension,
                        metric: 'cosine'
                    });
                    logger.info(`Created Pinecone index: ${indexName}`);
                } catch (createError) {
                    if (createError.message.includes('no pod quota available')) {
                        logger.warn('No pod quota available. Please create a serverless index manually in Pinecone console.');
                        throw new Error('No pod quota available. Please create a serverless index manually in Pinecone console or upgrade your plan.');
                    } else if (createError.message.includes('additional properties')) {
                        logger.warn('Index creation failed due to configuration. Trying to use existing index...');
                        // Don't throw error, try to use existing index
                    } else {
                        throw createError;
                    }
                }
            } else {
                logger.info(`Pinecone index already exists: ${indexName}`);
            }

            this.index = this.pinecone.index(indexName);
            return this.index;

        } catch (error) {
            logger.error('Failed to create Pinecone index:', error);
            throw error;
        }
    }

    /**
     * Insert vectors into the index
     */
    async upsertVectors(vectors) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const upsertResponse = await this.index.upsert(vectors);
            logger.info(`Upserted ${vectors.length} vectors to Pinecone`);
            return upsertResponse;

        } catch (error) {
            logger.error('Failed to upsert vectors to Pinecone:', error);
            throw error;
        }
    }

    /**
     * Query similar vectors
     */
    async queryVectors(queryVector, topK = 5, includeMetadata = true) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const queryResponse = await this.index.query({
                vector: queryVector,
                topK: topK,
                includeMetadata: includeMetadata
            });

            logger.info(`Queried Pinecone with topK=${topK}`);
            return queryResponse;

        } catch (error) {
            logger.error('Failed to query vectors from Pinecone:', error);
            throw error;
        }
    }

    /**
     * Delete vectors by IDs
     */
    async deleteVectors(ids) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const deleteResponse = await this.index.deleteMany(ids);
            logger.info(`Deleted ${ids.length} vectors from Pinecone`);
            return deleteResponse;

        } catch (error) {
            logger.error('Failed to delete vectors from Pinecone:', error);
            throw error;
        }
    }

    /**
     * Get index statistics
     */
    async getIndexStats() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const stats = await this.index.describeIndexStats();
            return stats;

        } catch (error) {
            logger.error('Failed to get Pinecone index stats:', error);
            throw error;
        }
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized && this.pinecone && this.index;
    }

    /**
     * Get the current index instance
     */
    getIndex() {
        if (!this.isInitialized) {
            throw new Error('Pinecone service not initialized. Call initialize() first.');
        }
        return this.index;
    }
}

// Export singleton instance
module.exports = new PineconeService();
