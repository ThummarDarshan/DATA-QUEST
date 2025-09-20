#!/usr/bin/env node

/**
 * Pinecone Setup Script
 * This script helps initialize Pinecone for the Fixit application
 */

require('dotenv').config();
const pineconeService = require('../services/pineconeService');
const pineconeConfig = require('../config/pinecone');
const logger = require('../utils/logger');

async function setupPinecone() {
    console.log('🚀 Setting up Pinecone for Fixit...\n');

    try {
        // Check configuration
        console.log('📋 Checking configuration...');
        if (!pineconeConfig.isConfigured) {
            console.error('❌ Pinecone configuration is incomplete!');
            console.log('\nRequired environment variables:');
            console.log('- PINECONE_API_KEY');
            console.log('- PINECONE_ENVIRONMENT');
            console.log('\nOptional environment variables:');
            console.log('- PINECONE_INDEX_NAME (default: fixit-chat-index)');
            console.log('- PINECONE_DIMENSION (default: 1536)');
            console.log('- PINECONE_METRIC (default: cosine)');
            console.log('- PINECONE_CLOUD (default: aws)');
            console.log('- PINECONE_REGION (default: us-east-1)');
            process.exit(1);
        }

        console.log('✅ Configuration looks good!');

        // Initialize Pinecone service
        console.log('\n🔌 Initializing Pinecone service...');
        await pineconeService.initialize();
        console.log('✅ Pinecone service initialized!');

        // Create index if it doesn't exist
        console.log('\n📊 Setting up index...');
        const indexName = pineconeConfig.indexName;
        const dimension = pineconeConfig.dimension;
        
        try {
            await pineconeService.createIndex(indexName, dimension);
            console.log(`✅ Index "${indexName}" is ready!`);
        } catch (error) {
            if (error.message.includes('no pod quota available')) {
                console.log('⚠️  Pod quota issue detected. Trying to use existing index...');
                // Try to use the existing index
                try {
                    const index = pineconeService.getIndex();
                    console.log(`✅ Using existing index "${indexName}"`);
                } catch (indexError) {
                    console.log('❌ Could not access existing index. Please check your Pinecone console:');
                    console.log('   1. Go to https://app.pinecone.io/');
                    console.log('   2. Create a serverless index manually');
                    console.log('   3. Or upgrade your plan to get pod quota');
                    throw error;
                }
            } else {
                throw error;
            }
        }

        // Get index stats
        console.log('\n📈 Getting index statistics...');
        const stats = await pineconeService.getIndexStats();
        console.log('Index Statistics:');
        console.log(`- Total Vectors: ${stats.totalVectorCount || 0}`);
        console.log(`- Dimension: ${stats.dimension || dimension}`);
        console.log(`- Index Fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);

        console.log('\n🎉 Pinecone setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Make sure to set your environment variables in .env file');
        console.log('2. Use pineconeService in your application code');
        console.log('3. Check the documentation for usage examples');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Verify your Pinecone API key and environment');
        console.log('2. Check your internet connection');
        console.log('3. Ensure you have the correct permissions');
        process.exit(1);
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    setupPinecone();
}

module.exports = setupPinecone;
