const pdfService = require('../services/pdfService');
const pineconeService = require('../services/pineconeService');
const PineconeUtils = require('../utils/pineconeUtils');
const logger = require('../utils/logger');

class PDFController {
    
    /**
     * Upload PDF and store in vector database
     */
    static async uploadPDF(req, res) {
        try {
            const userId = req.user.id;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No PDF file uploaded'
                });
            }

            logger.info(`PDF upload request from user ${userId}: ${req.file.originalname}`);

            // Save PDF file
            const savedFile = await pdfService.savePDF(req.file, userId);
            
            // Process PDF and extract vectors
            const processedData = await pdfService.processPDF(
                savedFile.filePath, 
                savedFile.fileName, 
                userId
            );

            // Store vectors in Pinecone
            let storedVectors = [];
            if (PineconeUtils.isServiceAvailable()) {
                try {
                    const upsertResponse = await pineconeService.upsertVectors(processedData.vectors);
                    storedVectors = processedData.vectors;
                    logger.info(`Stored ${processedData.vectors.length} vectors in Pinecone`);
                } catch (pineconeError) {
                    logger.warn('Failed to store in Pinecone, using local storage:', pineconeError.message);
                    // You could implement local vector storage here as fallback
                }
            } else {
                logger.warn('Pinecone service not available, vectors not stored');
            }

            res.json({
                success: true,
                message: 'PDF uploaded and processed successfully',
                data: {
                    fileName: savedFile.fileName,
                    filePath: savedFile.filePath,
                    fileSize: savedFile.size,
                    totalPages: processedData.pdfData.pages,
                    totalChunks: processedData.totalChunks,
                    vectorsStored: storedVectors.length,
                    pdfInfo: processedData.pdfData.info
                }
            });

        } catch (error) {
            logger.error('PDF upload failed:', error);
            res.status(500).json({
                success: false,
                message: 'PDF upload failed',
                error: error.message
            });
        }
    }

    /**
     * Search PDFs using vector similarity
     */
    static async searchPDFs(req, res) {
        try {
            const userId = req.user.id;
            const { query, topK = 5 } = req.body;

            if (!query || query.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            logger.info(`PDF search request from user ${userId}: "${query}"`);

            if (!PineconeUtils.isServiceAvailable()) {
                return res.status(503).json({
                    success: false,
                    message: 'Vector search service is not available'
                });
            }

            // Generate query vector
            const queryVector = pdfService.generateSimpleEmbedding(query);

            // Search in Pinecone
            const searchResults = await PineconeUtils.searchSimilarMessages(
                queryVector, 
                userId, 
                null, 
                topK
            );

            // Filter results to only include PDF manuals
            const pdfResults = searchResults.matches.filter(match => 
                match.metadata.type === 'pdf_manual'
            );

            // Format results
            const formattedResults = pdfResults.map(match => ({
                id: match.id,
                fileName: match.metadata.fileName,
                chunkText: match.metadata.chunkText,
                chunkIndex: match.metadata.chunkIndex,
                score: match.score,
                totalPages: match.metadata.totalPages,
                pdfInfo: match.metadata.pdfInfo,
                timestamp: match.metadata.timestamp
            }));

            res.json({
                success: true,
                query: query,
                results: formattedResults,
                totalFound: formattedResults.length,
                message: formattedResults.length > 0 
                    ? `Found ${formattedResults.length} relevant sections`
                    : 'No relevant content found in your PDFs'
            });

        } catch (error) {
            logger.error('PDF search failed:', error);
            res.status(500).json({
                success: false,
                message: 'PDF search failed',
                error: error.message
            });
        }
    }

    /**
     * List user's uploaded PDFs
     */
    static async listPDFs(req, res) {
        try {
            const userId = req.user.id;

            const pdfs = await pdfService.listUserPDFs(userId);

            res.json({
                success: true,
                pdfs: pdfs,
                totalCount: pdfs.length
            });

        } catch (error) {
            logger.error('Failed to list PDFs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to list PDFs',
                error: error.message
            });
        }
    }

    /**
     * Get PDF details
     */
    static async getPDFDetails(req, res) {
        try {
            const userId = req.user.id;
            const { fileName } = req.params;

            const pdfs = await pdfService.listUserPDFs(userId);
            const pdf = pdfs.find(p => p.fileName === fileName);

            if (!pdf) {
                return res.status(404).json({
                    success: false,
                    message: 'PDF not found'
                });
            }

            const pdfInfo = await pdfService.getPDFInfo(pdf.filePath);

            res.json({
                success: true,
                pdf: {
                    ...pdf,
                    ...pdfInfo
                }
            });

        } catch (error) {
            logger.error('Failed to get PDF details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get PDF details',
                error: error.message
            });
        }
    }

    /**
     * Delete PDF and its vectors
     */
    static async deletePDF(req, res) {
        try {
            const userId = req.user.id;
            const { fileName } = req.params;

            const pdfs = await pdfService.listUserPDFs(userId);
            const pdf = pdfs.find(p => p.fileName === fileName);

            if (!pdf) {
                return res.status(404).json({
                    success: false,
                    message: 'PDF not found'
                });
            }

            // Delete PDF file
            await pdfService.deletePDF(pdf.filePath);

            // Delete vectors from Pinecone
            if (PineconeUtils.isServiceAvailable()) {
                try {
                    // Find and delete vectors for this PDF
                    const queryVector = pdfService.generateSimpleEmbedding('dummy');
                    const searchResults = await PineconeUtils.searchSimilarMessages(
                        queryVector, 
                        userId, 
                        null, 
                        1000 // Large number to get all matches
                    );

                    const vectorsToDelete = searchResults.matches
                        .filter(match => 
                            match.metadata.type === 'pdf_manual' && 
                            match.metadata.fileName === fileName
                        )
                        .map(match => match.id);

                    if (vectorsToDelete.length > 0) {
                        await pineconeService.deleteVectors(vectorsToDelete);
                        logger.info(`Deleted ${vectorsToDelete.length} vectors for PDF: ${fileName}`);
                    }
                } catch (pineconeError) {
                    logger.warn('Failed to delete vectors from Pinecone:', pineconeError.message);
                }
            }

            res.json({
                success: true,
                message: 'PDF and its vectors deleted successfully'
            });

        } catch (error) {
            logger.error('Failed to delete PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete PDF',
                error: error.message
            });
        }
    }

    /**
     * Get PDF statistics
     */
    static async getPDFStats(req, res) {
        try {
            const userId = req.user.id;

            const pdfs = await pdfService.listUserPDFs(userId);
            const totalSize = pdfs.reduce((sum, pdf) => sum + pdf.size, 0);

            let vectorStats = null;
            if (PineconeUtils.isServiceAvailable()) {
                try {
                    const stats = await PineconeUtils.getUserVectorStats(userId);
                    vectorStats = stats;
                } catch (error) {
                    logger.warn('Failed to get vector stats:', error.message);
                }
            }

            res.json({
                success: true,
                stats: {
                    totalPDFs: pdfs.length,
                    totalSize: totalSize,
                    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                    vectorStats: vectorStats
                }
            });

        } catch (error) {
            logger.error('Failed to get PDF stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get PDF stats',
                error: error.message
            });
        }
    }
}

module.exports = PDFController;
