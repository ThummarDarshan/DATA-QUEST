#!/usr/bin/env node

/**
 * Simple Pinecone Test Script
 * This script just tests the connection without trying to create indexes
 */

require('dotenv').config();
const pineconeService = require('../services/pineconeService');
const logger = require('../utils/logger');

async function testPinecone() {
    console.log('🧪 Testing Pinecone connection...\n');

    try {
        // Test initialization
        console.log('1. Initializing Pinecone service...');
        await pineconeService.initialize();
        console.log('✅ Pinecone service initialized successfully!');

        // Test listing indexes
        console.log('\n2. Listing existing indexes...');
        const indexes = await pineconeService.pinecone.listIndexes();
        console.log('Available indexes:', indexes.indexes?.map(idx => idx.name) || 'None');

        // Test getting index stats
        console.log('\n3. Testing index access...');
        const indexName = process.env.PINECONE_INDEX_NAME || 'fixit-manual';
        try {
            const stats = await pineconeService.getIndexStats();
            console.log('✅ Index stats retrieved successfully!');
            console.log('Stats:', {
                totalVectors: stats.totalVectorCount || 0,
                dimension: stats.dimension || 'Unknown'
            });
        } catch (indexError) {
            console.log(`⚠️  Could not access index "${indexName}":`, indexError.message);
            console.log('This is normal if the index doesn\'t exist yet.');
        }

        console.log('\n🎉 Pinecone connection test completed!');
        console.log('\nNext steps:');
        console.log('1. If no indexes exist, create one manually in Pinecone console');
        console.log('2. Or upgrade your Pinecone plan to get pod quota');
        console.log('3. The service is ready to use with existing indexes');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check your PINECONE_API_KEY and PINECONE_ENVIRONMENT');
        console.log('2. Verify your internet connection');
        console.log('3. Check Pinecone status at https://status.pinecone.io/');
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testPinecone();
}

module.exports = testPinecone;
