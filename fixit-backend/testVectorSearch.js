#!/usr/bin/env node

/**
 * Test Vector Search - Quick test of vector database functionality
 * This script demonstrates storing and searching data
 */

const VectorDBFetchMock = require('./VectorDBFetchMock');

async function testVectorSearch() {
    console.log('🧪 Testing Vector Database Search Functionality');
    console.log('===============================================\n');

    const vectorDB = new VectorDBFetchMock();

    try {
        // Step 1: Store data
        console.log('Step 1: Storing manual data...');
        await vectorDB.storeManualData();
        console.log('✅ Data stored successfully!\n');

        // Step 2: Show statistics
        console.log('Step 2: Database statistics...');
        await vectorDB.getStats();
        console.log('');

        // Step 3: Test various searches
        const testQueries = [
            'authentication login',
            'database configuration',
            'API endpoints',
            'troubleshooting errors',
            'security guidelines',
            'installation setup',
            'configuration options',
            'getting started'
        ];

        console.log('Step 3: Testing search queries...\n');

        for (const query of testQueries) {
            console.log(`🔍 Testing query: "${query}"`);
            console.log('-'.repeat(40));
            await vectorDB.fetchData(query, 2); // Get top 2 results
            console.log('');
        }

        console.log('🎉 All tests completed successfully!');
        console.log('\n💡 This demonstrates how the vector database works:');
        console.log('   - Data is stored as vectors (embeddings)');
        console.log('   - Search queries are converted to vectors');
        console.log('   - Similarity is calculated using cosine similarity');
        console.log('   - Results are ranked by relevance score');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testVectorSearch();
}

module.exports = testVectorSearch;
