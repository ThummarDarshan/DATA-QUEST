#!/usr/bin/env node

/**
 * PDF Upload Processor - Standalone PDF processing and vector storage
 * This script processes PDFs from a folder and stores them in Pinecone
 * Usage: node PDFUploadProcessor.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfService = require('./services/pdfService');
const pineconeService = require('./services/pineconeService');
const PineconeUtils = require('./utils/pineconeUtils');

class PDFUploadProcessor {
    constructor() {
        this.manualsFolder = './manuals'; // Folder containing PDF manuals
        this.processedFolder = './manuals/processed'; // Folder for processed PDFs
        this.userId = 'system'; // System user ID for processing
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.manualsFolder)) {
            fs.mkdirSync(this.manualsFolder, { recursive: true });
            console.log(`📁 Created manuals folder: ${this.manualsFolder}`);
        }

        if (!fs.existsSync(this.processedFolder)) {
            fs.mkdirSync(this.processedFolder, { recursive: true });
            console.log(`📁 Created processed folder: ${this.processedFolder}`);
        }
    }

    /**
     * Get all PDF files from manuals folder
     */
    getPDFFiles() {
        try {
            const files = fs.readdirSync(this.manualsFolder);
            return files.filter(file => 
                file.toLowerCase().endsWith('.pdf') && 
                !file.startsWith('.')
            );
        } catch (error) {
            console.error('❌ Failed to read manuals folder:', error.message);
            return [];
        }
    }

    /**
     * Process a single PDF file
     */
    async processPDF(fileName) {
        try {
            console.log(`\n📄 Processing: ${fileName}`);
            
            const filePath = path.join(this.manualsFolder, fileName);
            const fileStats = fs.statSync(filePath);
            
            console.log(`   Size: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);
            
            // Process PDF and extract vectors
            const processedData = await pdfService.processPDF(
                filePath, 
                fileName, 
                this.userId
            );

            console.log(`   Pages: ${processedData.pdfData.pages}`);
            console.log(`   Chunks: ${processedData.totalChunks}`);
            console.log(`   Vectors: ${processedData.vectors.length}`);

            // Store vectors in Pinecone
            let storedCount = 0;
            if (PineconeUtils.isServiceAvailable()) {
                try {
                    const upsertResponse = await pineconeService.upsertVectors(processedData.vectors);
                    storedCount = processedData.vectors.length;
                    console.log(`   ✅ Stored ${storedCount} vectors in Pinecone`);
                } catch (pineconeError) {
                    console.log(`   ⚠️  Failed to store in Pinecone: ${pineconeError.message}`);
                }
            } else {
                console.log(`   ⚠️  Pinecone not available, vectors not stored`);
            }

            // Move processed file
            const processedPath = path.join(this.processedFolder, fileName);
            fs.renameSync(filePath, processedPath);
            console.log(`   📁 Moved to processed folder`);

            return {
                fileName,
                success: true,
                pages: processedData.pdfData.pages,
                chunks: processedData.totalChunks,
                vectors: processedData.vectors.length,
                stored: storedCount
            };

        } catch (error) {
            console.error(`   ❌ Failed to process ${fileName}:`, error.message);
            return {
                fileName,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process all PDFs in the manuals folder
     */
    async processAllPDFs() {
        try {
            console.log('🚀 Starting PDF processing...\n');

            // Ensure directories exist
            this.ensureDirectories();

            // Get all PDF files
            const pdfFiles = this.getPDFFiles();
            
            if (pdfFiles.length === 0) {
                console.log('📝 No PDF files found in manuals folder');
                console.log(`   Please add PDF files to: ${path.resolve(this.manualsFolder)}`);
                return;
            }

            console.log(`📚 Found ${pdfFiles.length} PDF files to process:`);
            pdfFiles.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file}`);
            });

            // Process each PDF
            const results = [];
            for (const fileName of pdfFiles) {
                const result = await this.processPDF(fileName);
                results.push(result);
            }

            // Display summary
            this.displaySummary(results);

        } catch (error) {
            console.error('❌ PDF processing failed:', error.message);
        }
    }

    /**
     * Display processing summary
     */
    displaySummary(results) {
        console.log('\n📊 Processing Summary');
        console.log('=' .repeat(50));

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ Successfully processed: ${successful.length}`);
        console.log(`❌ Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log('\n📄 Processed Files:');
            successful.forEach(result => {
                console.log(`   • ${result.fileName}`);
                console.log(`     Pages: ${result.pages}, Chunks: ${result.chunks}, Vectors: ${result.vectors}`);
                if (result.stored > 0) {
                    console.log(`     Stored in Pinecone: ${result.stored}`);
                }
            });
        }

        if (failed.length > 0) {
            console.log('\n❌ Failed Files:');
            failed.forEach(result => {
                console.log(`   • ${result.fileName}: ${result.error}`);
            });
        }

        const totalVectors = successful.reduce((sum, r) => sum + r.vectors, 0);
        const totalStored = successful.reduce((sum, r) => sum + r.stored, 0);

        console.log(`\n📈 Total Statistics:`);
        console.log(`   Total vectors generated: ${totalVectors}`);
        console.log(`   Vectors stored in Pinecone: ${totalStored}`);
        console.log(`   Processed files moved to: ${path.resolve(this.processedFolder)}`);

        if (totalStored > 0) {
            console.log('\n🎉 PDF processing completed successfully!');
            console.log('   You can now search your manuals using the search functionality.');
        } else {
            console.log('\n⚠️  PDFs processed but not stored in Pinecone');
            console.log('   Please check your Pinecone configuration.');
        }
    }

    /**
     * Search in processed PDFs
     */
    async searchPDFs(query, topK = 5) {
        try {
            console.log(`\n🔍 Searching for: "${query}"`);

            if (!PineconeUtils.isServiceAvailable()) {
                console.log('❌ Pinecone service not available');
                return;
            }

            // Generate query vector
            const queryVector = pdfService.generateSimpleEmbedding(query);

            // Search in Pinecone
            const searchResults = await PineconeUtils.searchSimilarMessages(
                queryVector, 
                this.userId, 
                null, 
                topK
            );

            // Filter results to only include PDF manuals
            const pdfResults = searchResults.matches.filter(match => 
                match.metadata.type === 'pdf_manual'
            );

            console.log(`\n📋 Found ${pdfResults.length} results:`);
            console.log('=' .repeat(50));

            if (pdfResults.length === 0) {
                console.log('❌ No relevant content found in your PDFs');
                return;
            }

            // Display results
            pdfResults.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.metadata.fileName}`);
                console.log(`   Score: ${result.score.toFixed(4)}`);
                console.log(`   Chunk ${result.metadata.chunkIndex + 1} of ${result.metadata.totalPages} pages`);
                console.log(`   Content: ${result.metadata.chunkText.substring(0, 150)}...`);
            });

        } catch (error) {
            console.error('❌ Search failed:', error.message);
        }
    }

    /**
     * Get processing statistics
     */
    async getStats() {
        try {
            console.log('\n📊 PDF Processing Statistics');
            console.log('=' .repeat(50));

            // Count processed files
            const processedFiles = fs.readdirSync(this.processedFolder)
                .filter(file => file.endsWith('.pdf'));

            console.log(`📁 Processed files: ${processedFiles.length}`);
            processedFiles.forEach(file => {
                const filePath = path.join(this.processedFolder, file);
                const stats = fs.statSync(filePath);
                console.log(`   • ${file} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
            });

            // Get vector stats
            if (PineconeUtils.isServiceAvailable()) {
                try {
                    const stats = await PineconeUtils.getUserVectorStats(this.userId);
                    console.log(`\n🔢 Vector Database Stats:`);
                    console.log(`   Total vectors: ${stats.totalVectors || 0}`);
                    console.log(`   Dimension: ${stats.dimension || 'Unknown'}`);
                } catch (error) {
                    console.log(`\n⚠️  Could not get vector stats: ${error.message}`);
                }
            } else {
                console.log('\n⚠️  Pinecone service not available');
            }

        } catch (error) {
            console.error('❌ Failed to get stats:', error.message);
        }
    }
}

/**
 * Interactive console interface
 */
async function runInteractiveMode() {
    const processor = new PDFUploadProcessor();
    const readline = require('readline');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🚀 PDF Upload Processor - Interactive Mode');
    console.log('==========================================');
    console.log('Commands:');
    console.log('1. process - Process all PDFs in manuals folder');
    console.log('2. search <query> - Search in processed PDFs');
    console.log('3. stats - Show processing statistics');
    console.log('4. exit - Exit the program');
    console.log('');

    const askQuestion = () => {
        rl.question('Enter command: ', async (input) => {
            const [command, ...args] = input.trim().split(' ');

            try {
                switch (command.toLowerCase()) {
                    case 'process':
                        await processor.processAllPDFs();
                        break;

                    case 'search':
                        if (args.length === 0) {
                            console.log('❌ Please provide a search query');
                        } else {
                            const query = args.join(' ');
                            await processor.searchPDFs(query);
                        }
                        break;

                    case 'stats':
                        await processor.getStats();
                        break;

                    case 'exit':
                        console.log('👋 Goodbye!');
                        rl.close();
                        return;

                    default:
                        console.log('❌ Unknown command. Available commands: process, search, stats, exit');
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
        console.log('🎯 PDF Upload Processor');
        console.log('======================');
        console.log('This tool processes PDF manuals and stores them in Pinecone vector database');
        console.log('');

        // Check if running in interactive mode
        if (process.argv.length > 2) {
            const command = process.argv[2];
            const processor = new PDFUploadProcessor();

            switch (command) {
                case 'process':
                    await processor.processAllPDFs();
                    break;
                case 'stats':
                    await processor.getStats();
                    break;
                default:
                    console.log('Available commands: process, stats');
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

module.exports = PDFUploadProcessor;
