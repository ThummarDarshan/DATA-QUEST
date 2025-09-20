#!/usr/bin/env node

/**
 * VectorDBFetch - Standalone Vector Database Test
 * This file tests storing and fetching data from Pinecone vector database
 * Usage: node VectorDBFetch.js
 */

require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');

class VectorDBFetch {
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
            const indexName = process.env.PINECONE_INDEX_NAME || 'fixit-manual';
            const dimension = parseInt(process.env.PINECONE_DIMENSION) || 1024;

            if (!apiKey || !environment) {
                throw new Error('Pinecone API key and environment are required');
            }

            console.log('🔌 Initializing Pinecone connection...');
            this.pinecone = new Pinecone({
                apiKey: apiKey,
                environment: environment
            });

            // Check if index exists, create if it doesn't
            try {
                const indexes = await this.pinecone.listIndexes();
                const indexExists = indexes.indexes?.some(idx => idx.name === indexName);
                
                if (!indexExists) {
                    console.log(`📊 Creating index "${indexName}"...`);
                    try {
                        await this.pinecone.createIndex({
                            name: indexName,
                            dimension: dimension,
                            metric: 'cosine'
                        });
                        console.log('✅ Index created successfully!');
                    } catch (createError) {
                        if (createError.message.includes('no pod quota available')) {
                            console.log('⚠️  No pod quota available. Please create a serverless index manually in Pinecone console.');
                            console.log('   Go to: https://app.pinecone.io/');
                            console.log('   Create a serverless index with:');
                            console.log(`   - Name: ${indexName}`);
                            console.log(`   - Dimensions: ${dimension}`);
                            console.log('   - Metric: cosine');
                            console.log('   - Cloud: AWS');
                            console.log('   - Region: us-east-1');
                            throw new Error('Please create the index manually in Pinecone console');
                        } else {
                            throw createError;
                        }
                    }
                } else {
                    console.log(`✅ Index "${indexName}" already exists`);
                }
            } catch (listError) {
                console.log('⚠️  Could not list indexes, trying to use existing index...');
            }

            this.index = this.pinecone.index(indexName);
            this.isInitialized = true;

            console.log('✅ Pinecone initialized successfully!');
            return this.pinecone;

        } catch (error) {
            console.error('❌ Failed to initialize Pinecone:', error.message);
            throw error;
        }
    }

    /**
     * Generate a simple embedding vector (for testing purposes)
     * In production, you would use a proper embedding service like OpenAI, Cohere, etc.
     */
    generateSimpleEmbedding(text, dimension = 1024) {
        // This is a simple hash-based embedding for testing
        // In production, use a proper embedding service
        const hash = this.simpleHash(text);
        const vector = new Array(dimension).fill(0);
        
        // Distribute the hash across the vector dimensions
        for (let i = 0; i < dimension; i++) {
            vector[i] = Math.sin(hash + i) * 0.1;
        }
        
        return vector;
    }

    /**
     * Simple hash function for generating consistent embeddings
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Store manual data in vector database
     */
    async storeManualData() {
        try {
            await this.initialize();

            console.log('\n📚 Storing manual data in vector database...');

            // Sample manual data (you can replace this with actual PDF content)
            const manualData = [
                {
                    id: 'manual_1',
                    title: 'Getting Started Guide',
                    content: 'This is the getting started guide for the application. It covers basic setup and configuration.',
                    section: 'Introduction'
                },
                {
                    id: 'manual_2',
                    title: 'User Authentication',
                    content: 'Learn how to authenticate users and manage sessions. Includes login, logout, and password reset.',
                    section: 'Authentication'
                },
                {
                    id: 'manual_3',
                    title: 'API Documentation',
                    content: 'Complete API reference with endpoints, parameters, and response formats.',
                    section: 'API'
                },
                {
                    id: 'manual_4',
                    title: 'Database Configuration',
                    content: 'How to configure and connect to the database. Includes connection strings and settings.',
                    section: 'Database'
                },
                {
                    id: 'manual_5',
                    title: 'Troubleshooting',
                    content: 'Common issues and their solutions. Error codes and debugging tips.',
                    section: 'Support'
                }
            ];

            const vectors = manualData.map(item => ({
                id: item.id,
                values: this.generateSimpleEmbedding(item.content),
                metadata: {
                    title: item.title,
                    content: item.content,
                    section: item.section,
                    type: 'manual',
                    timestamp: new Date().toISOString()
                }
            }));

            console.log(`📝 Preparing ${vectors.length} vectors for storage...`);

            const upsertResponse = await this.index.upsert(vectors);
            console.log('✅ Manual data stored successfully!');
            console.log(`📊 Upserted ${vectors.length} vectors`);

            return upsertResponse;

        } catch (error) {
            console.error('❌ Failed to store manual data:', error.message);
            throw error;
        }
    }

    /**
     * Fetch data from vector database based on query
     */
    async fetchData(query, topK = 3) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log(`\n🔍 Searching for: "${query}"`);
            console.log(`📊 Top ${topK} results requested`);

            // Generate embedding for the query
            const queryVector = this.generateSimpleEmbedding(query);

            // Search in vector database
            const searchResponse = await this.index.query({
                vector: queryVector,
                topK: topK,
                includeMetadata: true,
                filter: {
                    type: { $eq: 'manual' }
                }
            });

            console.log(`\n📋 Found ${searchResponse.matches.length} results:`);
            console.log('=' .repeat(50));

            if (searchResponse.matches.length === 0) {
                console.log('❌ No data found in vector database for this query');
                console.log('💡 The vector database might not have data for this manual');
                return [];
            }

            // Display results
            searchResponse.matches.forEach((match, index) => {
                console.log(`\n${index + 1}. ${match.metadata.title}`);
                console.log(`   Section: ${match.metadata.section}`);
                console.log(`   Score: ${match.score.toFixed(4)}`);
                console.log(`   Content: ${match.metadata.content.substring(0, 100)}...`);
                console.log(`   ID: ${match.id}`);
            });

            return searchResponse.matches;

        } catch (error) {
            console.error('❌ Failed to fetch data:', error.message);
            throw error;
        }
    }

    /**
     * Get vector database statistics
     */
    async getStats() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('\n📊 Vector Database Statistics:');
            const stats = await this.index.describeIndexStats();
            
            console.log(`- Total Vectors: ${stats.totalVectorCount || 0}`);
            console.log(`- Dimension: ${stats.dimension || 'Unknown'}`);
            console.log(`- Index Fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
            
            return stats;

        } catch (error) {
            console.error('❌ Failed to get stats:', error.message);
            throw error;
        }
    }

    /**
     * Clear all manual data from vector database
     */
    async clearManualData() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('\n🗑️  Clearing manual data from vector database...');

            // Delete all vectors with type 'manual'
            const deleteResponse = await this.index.deleteMany({
                type: { $eq: 'manual' }
            });

            console.log('✅ Manual data cleared successfully!');
            return deleteResponse;

        } catch (error) {
            console.error('❌ Failed to clear manual data:', error.message);
            throw error;
        }
    }
}

/**
 * Interactive console interface
 */
async function runInteractiveMode() {
    const vectorDB = new VectorDBFetch();
    const readline = require('readline');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🚀 VectorDBFetch - Interactive Mode');
    console.log('=====================================');
    console.log('Commands:');
    console.log('1. store - Store manual data in vector database');
    console.log('2. search <query> - Search for data');
    console.log('3. stats - Show database statistics');
    console.log('4. clear - Clear all manual data');
    console.log('5. exit - Exit the program');
    console.log('');

    const askQuestion = () => {
        rl.question('Enter command: ', async (input) => {
            const [command, ...args] = input.trim().split(' ');

            try {
                switch (command.toLowerCase()) {
                    case 'store':
                        await vectorDB.storeManualData();
                        break;

                    case 'search':
                        if (args.length === 0) {
                            console.log('❌ Please provide a search query');
                        } else {
                            const query = args.join(' ');
                            await vectorDB.fetchData(query);
                        }
                        break;

                    case 'stats':
                        await vectorDB.getStats();
                        break;

                    case 'clear':
                        await vectorDB.clearManualData();
                        break;

                    case 'exit':
                        console.log('👋 Goodbye!');
                        rl.close();
                        return;

                    default:
                        console.log('❌ Unknown command. Available commands: store, search, stats, clear, exit');
                }
            } catch (error) {
                console.error('❌ Error:', error.message);
            }

            console.log('');
            askQuestion();
        });
    };

    askQuestion();
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('🎯 VectorDBFetch - Vector Database Test Tool');
        console.log('============================================');

        // Check if running in interactive mode
        if (process.argv.length > 2) {
            const command = process.argv[2];
            const vectorDB = new VectorDBFetch();

            switch (command) {
                case 'store':
                    await vectorDB.storeManualData();
                    break;
                case 'stats':
                    await vectorDB.getStats();
                    break;
                case 'clear':
                    await vectorDB.clearManualData();
                    break;
                default:
                    console.log('Available commands: store, stats, clear');
                    console.log('Or run without arguments for interactive mode');
            }
        } else {
            // Run in interactive mode
            await runInteractiveMode();
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = VectorDBFetch;
