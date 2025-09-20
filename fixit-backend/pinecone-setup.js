const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

// Simple Pinecone connection test
async function testPineconeConnection() {
    try {
        console.log('🔄 Testing Pinecone connection...');
        
        // Check if API key exists
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error('❌ PINECONE_API_KEY not found in environment variables');
        }
        
        console.log('✅ API key found');
        
        // Get environment from .env or use default
        const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws';
        console.log(`🌍 Using environment: ${environment}`);
        
        // Initialize Pinecone client
        const pc = new Pinecone({
            apiKey: apiKey,
            environment: environment
        });
        
        console.log('✅ Pinecone client initialized');
        
        // Test connection by listing indexes
        const indexList = await pc.listIndexes();
        console.log('✅ Successfully connected to Pinecone!');
        console.log(`📊 Found ${indexList.indexes?.length || 0} indexes in your account`);
        
        // Display available indexes
        if (indexList.indexes && indexList.indexes.length > 0) {
            console.log('\n📋 Available indexes:');
            indexList.indexes.forEach((index, i) => {
                console.log(`   ${i + 1}. ${index.name} (${index.dimension} dimensions, ${index.metric} metric)`);
            });
        } else {
            console.log('📝 No indexes found in your account');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        return false;
    }
}

// Test specific index connection
async function testIndexConnection(indexName = 'fixit-manual') {
    try {
        console.log(`\n🔄 Testing connection to index: ${indexName}`);
        
        const apiKey = process.env.PINECONE_API_KEY;
        const pc = new Pinecone({ 
            apiKey,
            environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws'
        });
        
        // Try to connect to specific index
        const index = pc.index(indexName);
        
        // Test index by getting stats
        const stats = await index.describeIndexStats();
        
        console.log(`✅ Successfully connected to index: ${indexName}`);
        console.log(`📊 Index stats:`);
        console.log(`   - Total vectors: ${stats.totalVectorCount || 0}`);
        console.log(`   - Dimension: ${stats.dimension || 'N/A'}`);
        console.log(`   - Index fullness: ${stats.indexFullness || 0}`);
        
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to connect to index '${indexName}':`, error.message);
        return false;
    }
}

// Main function to run all tests
async function main() {
    console.log('🚀 Starting Pinecone Connection Test\n');
    
    // Test general connection
    const generalConnection = await testPineconeConnection();
    
    if (generalConnection) {
        // Test specific index connection
        await testIndexConnection('fixit-manual');
    }
    
    console.log('\n🏁 Connection test completed!');
}

// Export functions for use in other files
module.exports = {
    testPineconeConnection,
    testIndexConnection
};

// Run the test if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}