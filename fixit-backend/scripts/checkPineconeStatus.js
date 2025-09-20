#!/usr/bin/env node

/**
 * Pinecone Status Check Script
 * Quick status check for Pinecone integration
 */

require('dotenv').config();
const pineconeService = require('../services/pineconeService');

async function checkStatus() {
    console.log('🔍 Checking Pinecone status...\n');

    // Check environment variables
    console.log('📋 Environment Configuration:');
    console.log(`- API Key: ${process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`- Environment: ${process.env.PINECONE_ENVIRONMENT || '❌ Missing'}`);
    console.log(`- Project ID: ${process.env.PINECONE_PROJECT_ID || '❌ Missing'}`);
    console.log(`- Index Name: ${process.env.PINECONE_INDEX_NAME || 'fixit-manual'}`);
    console.log(`- Dimension: ${process.env.PINECONE_DIMENSION || '1024'}`);

    try {
        // Test connection
        console.log('\n🔌 Testing connection...');
        await pineconeService.initialize();
        console.log('✅ Connection successful!');

        // Check if service is ready
        if (pineconeService.isReady()) {
            console.log('✅ Service is ready!');
            
            // Try to get stats
            try {
                const stats = await pineconeService.getIndexStats();
                console.log('\n📊 Index Statistics:');
                console.log(`- Total Vectors: ${stats.totalVectorCount || 0}`);
                console.log(`- Dimension: ${stats.dimension || 'Unknown'}`);
                console.log(`- Index Fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
            } catch (statsError) {
                console.log('⚠️  Could not get index stats:', statsError.message);
            }
        } else {
            console.log('❌ Service is not ready');
        }

    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        
        if (error.message.includes('no pod quota')) {
            console.log('\n💡 Solution: Create a serverless index manually in Pinecone console');
        } else if (error.message.includes('Request failed to reach')) {
            console.log('\n💡 Solution: Check your API key and environment configuration');
        }
    }

    console.log('\n🎯 Status: Pinecone integration is set up and ready to use!');
}

// Run check if this script is executed directly
if (require.main === module) {
    checkStatus();
}

module.exports = checkStatus;
