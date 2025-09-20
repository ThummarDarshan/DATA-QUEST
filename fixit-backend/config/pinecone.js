require('dotenv').config();

const pineconeConfig = {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    projectId: process.env.PINECONE_PROJECT_ID,
    indexName: process.env.PINECONE_INDEX_NAME || 'fixit-chat-index',
    dimension: parseInt(process.env.PINECONE_DIMENSION) || 1536, // Default for OpenAI embeddings
    metric: process.env.PINECONE_METRIC || 'cosine',
    cloud: process.env.PINECONE_CLOUD || 'aws',
    region: process.env.PINECONE_REGION || 'us-east-1'
};

// Validate required configuration
const validateConfig = () => {
    const required = ['apiKey', 'environment'];
    const missing = required.filter(key => !pineconeConfig[key]);
    
    if (missing.length > 0) {
        console.warn(`Missing Pinecone configuration: ${missing.join(', ')}`);
        console.warn('Pinecone service will not be available until configuration is complete.');
        return false;
    }
    
    if (!pineconeConfig.projectId) {
        console.warn('PINECONE_PROJECT_ID not set. This may cause issues with some operations.');
    }
    
    return true;
};

module.exports = {
    ...pineconeConfig,
    validateConfig,
    isConfigured: validateConfig()
};
