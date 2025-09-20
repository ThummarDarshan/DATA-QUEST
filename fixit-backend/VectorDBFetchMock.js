#!/usr/bin/env node

/**
 * VectorDBFetchMock - Mock Vector Database Test
 * This file tests storing and fetching data using a mock vector database
 * Use this when Pinecone index is not available
 * Usage: node VectorDBFetchMock.js
 */

class VectorDBFetchMock {
    constructor() {
        this.vectors = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize mock vector database
     */
    async initialize() {
        console.log('🔌 Initializing Mock Vector Database...');
        this.isInitialized = true;
        console.log('✅ Mock Vector Database initialized successfully!');
    }

    /**
     * Generate a simple embedding vector (for testing purposes)
     */
    generateSimpleEmbedding(text, dimension = 1024) {
        // This is a simple hash-based embedding for testing
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
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Store manual data in mock vector database
     */
    async storeManualData() {
        try {
            await this.initialize();

            console.log('\n📚 Storing manual data in mock vector database...');

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
                },
                {
                    id: 'manual_6',
                    title: 'Installation Guide',
                    content: 'Step-by-step installation instructions for different operating systems.',
                    section: 'Installation'
                },
                {
                    id: 'manual_7',
                    title: 'Configuration Settings',
                    content: 'Detailed explanation of all configuration options and their effects.',
                    section: 'Configuration'
                },
                {
                    id: 'manual_8',
                    title: 'Security Best Practices',
                    content: 'Security guidelines and recommendations for protecting your application.',
                    section: 'Security'
                }
            ];

            let storedCount = 0;
            for (const item of manualData) {
                const vector = {
                    id: item.id,
                    values: this.generateSimpleEmbedding(item.content),
                    metadata: {
                        title: item.title,
                        content: item.content,
                        section: item.section,
                        type: 'manual',
                        timestamp: new Date().toISOString()
                    }
                };

                this.vectors.set(item.id, vector);
                storedCount++;
            }

            console.log(`✅ Manual data stored successfully!`);
            console.log(`📊 Stored ${storedCount} vectors in mock database`);

            return { upsertedCount: storedCount };

        } catch (error) {
            console.error('❌ Failed to store manual data:', error.message);
            throw error;
        }
    }

    /**
     * Fetch data from mock vector database based on query
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

            // Calculate similarities for all vectors
            const similarities = [];
            for (const [id, vector] of this.vectors) {
                if (vector.metadata.type === 'manual') {
                    const similarity = this.cosineSimilarity(queryVector, vector.values);
                    similarities.push({
                        id: vector.id,
                        score: similarity,
                        metadata: vector.metadata
                    });
                }
            }

            // Sort by similarity score (descending)
            similarities.sort((a, b) => b.score - a.score);

            // Get top K results
            const results = similarities.slice(0, topK);

            console.log(`\n📋 Found ${results.length} results:`);
            console.log('=' .repeat(50));

            if (results.length === 0) {
                console.log('❌ No data found in vector database for this query');
                console.log('💡 The vector database might not have data for this manual');
                return [];
            }

            // Display results
            results.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.metadata.title}`);
                console.log(`   Section: ${result.metadata.section}`);
                console.log(`   Score: ${result.score.toFixed(4)}`);
                console.log(`   Content: ${result.metadata.content.substring(0, 100)}...`);
                console.log(`   ID: ${result.id}`);
            });

            return results;

        } catch (error) {
            console.error('❌ Failed to fetch data:', error.message);
            throw error;
        }
    }

    /**
     * Get mock vector database statistics
     */
    async getStats() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('\n📊 Mock Vector Database Statistics:');
            console.log(`- Total Vectors: ${this.vectors.size}`);
            console.log(`- Dimension: 1024`);
            console.log(`- Database Type: Mock (In-Memory)`);
            
            // Count by type
            const typeCount = {};
            for (const [id, vector] of this.vectors) {
                const type = vector.metadata.type || 'unknown';
                typeCount[type] = (typeCount[type] || 0) + 1;
            }
            
            console.log('- Vectors by type:');
            Object.entries(typeCount).forEach(([type, count]) => {
                console.log(`  - ${type}: ${count}`);
            });
            
            return {
                totalVectorCount: this.vectors.size,
                dimension: 1024,
                typeCount
            };

        } catch (error) {
            console.error('❌ Failed to get stats:', error.message);
            throw error;
        }
    }

    /**
     * Clear all manual data from mock vector database
     */
    async clearManualData() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('\n🗑️  Clearing manual data from mock vector database...');

            let clearedCount = 0;
            for (const [id, vector] of this.vectors) {
                if (vector.metadata.type === 'manual') {
                    this.vectors.delete(id);
                    clearedCount++;
                }
            }

            console.log(`✅ Manual data cleared successfully!`);
            console.log(`📊 Cleared ${clearedCount} vectors`);

            return { deletedCount: clearedCount };

        } catch (error) {
            console.error('❌ Failed to clear manual data:', error.message);
            throw error;
        }
    }

    /**
     * List all stored data
     */
    async listAllData() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('\n📋 All stored data:');
            console.log('=' .repeat(50));

            if (this.vectors.size === 0) {
                console.log('❌ No data stored in vector database');
                return [];
            }

            let index = 1;
            for (const [id, vector] of this.vectors) {
                console.log(`\n${index}. ${vector.metadata.title}`);
                console.log(`   ID: ${vector.id}`);
                console.log(`   Section: ${vector.metadata.section}`);
                console.log(`   Type: ${vector.metadata.type}`);
                console.log(`   Content: ${vector.metadata.content.substring(0, 80)}...`);
                index++;
            }

            return Array.from(this.vectors.values());

        } catch (error) {
            console.error('❌ Failed to list data:', error.message);
            throw error;
        }
    }
}

/**
 * Interactive console interface
 */
async function runInteractiveMode() {
    const vectorDB = new VectorDBFetchMock();
    const readline = require('readline');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🚀 VectorDBFetchMock - Interactive Mode');
    console.log('========================================');
    console.log('Commands:');
    console.log('1. store - Store manual data in vector database');
    console.log('2. search <query> - Search for data');
    console.log('3. stats - Show database statistics');
    console.log('4. list - List all stored data');
    console.log('5. clear - Clear all manual data');
    console.log('6. exit - Exit the program');
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

                    case 'list':
                        await vectorDB.listAllData();
                        break;

                    case 'clear':
                        await vectorDB.clearManualData();
                        break;

                    case 'exit':
                        console.log('👋 Goodbye!');
                        rl.close();
                        return;

                    default:
                        console.log('❌ Unknown command. Available commands: store, search, stats, list, clear, exit');
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
        console.log('🎯 VectorDBFetchMock - Mock Vector Database Test Tool');
        console.log('=====================================================');
        console.log('ℹ️  This is a mock version for testing without Pinecone index');
        console.log('');

        // Check if running in interactive mode
        if (process.argv.length > 2) {
            const command = process.argv[2];
            const vectorDB = new VectorDBFetchMock();

            switch (command) {
                case 'store':
                    await vectorDB.storeManualData();
                    break;
                case 'stats':
                    await vectorDB.getStats();
                    break;
                case 'list':
                    await vectorDB.listAllData();
                    break;
                case 'clear':
                    await vectorDB.clearManualData();
                    break;
                default:
                    console.log('Available commands: store, stats, list, clear');
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

module.exports = VectorDBFetchMock;
