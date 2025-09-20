const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const logger = require('../utils/logger');

class PDFService {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || 'uploads/manuals/';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
        this.allowedMimeTypes = ['application/pdf'];
    }

    /**
     * Ensure upload directory exists
     */
    ensureUploadDir() {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
            logger.info(`Created upload directory: ${this.uploadPath}`);
        }
    }

    /**
     * Validate PDF file
     */
    validatePDF(file) {
        const errors = [];

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        // Check MIME type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            errors.push('Only PDF files are allowed');
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf') {
            errors.push('File must have .pdf extension');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Extract text from PDF file
     */
    async extractTextFromPDF(filePath) {
        try {
            logger.info(`Extracting text from PDF: ${filePath}`);
            
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            
            const extractedData = {
                text: data.text,
                pages: data.numpages,
                info: data.info,
                metadata: data.metadata,
                version: data.version
            };

            logger.info(`Successfully extracted text from PDF: ${extractedData.pages} pages`);
            return extractedData;

        } catch (error) {
            logger.error('Failed to extract text from PDF:', error);
            throw new Error(`PDF text extraction failed: ${error.message}`);
        }
    }

    /**
     * Split text into chunks for vector storage
     */
    chunkText(text, chunkSize = 1000, overlap = 200) {
        const chunks = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        let currentChunk = '';
        let chunkIndex = 0;

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            // If adding this sentence would exceed chunk size, save current chunk
            if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `chunk_${chunkIndex}`,
                    text: currentChunk.trim(),
                    index: chunkIndex,
                    startChar: text.indexOf(currentChunk),
                    endChar: text.indexOf(currentChunk) + currentChunk.length
                });
                
                // Start new chunk with overlap
                const overlapText = currentChunk.slice(-overlap);
                currentChunk = overlapText + ' ' + trimmedSentence;
                chunkIndex++;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            }
        }

        // Add the last chunk
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `chunk_${chunkIndex}`,
                text: currentChunk.trim(),
                index: chunkIndex,
                startChar: text.indexOf(currentChunk),
                endChar: text.indexOf(currentChunk) + currentChunk.length
            });
        }

        logger.info(`Split text into ${chunks.length} chunks`);
        return chunks;
    }

    /**
     * Generate a simple embedding for text (for testing)
     * In production, use OpenAI, Cohere, or other embedding services
     */
    generateSimpleEmbedding(text, dimension = 1024) {
        const hash = this.simpleHash(text);
        const vector = new Array(dimension).fill(0);
        
        for (let i = 0; i < dimension; i++) {
            vector[i] = Math.sin(hash + i) * 0.1;
        }
        
        return vector;
    }

    /**
     * Simple hash function for consistent embeddings
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Process PDF file and prepare for vector storage
     */
    async processPDF(filePath, originalName, userId) {
        try {
            logger.info(`Processing PDF: ${originalName}`);

            // Extract text from PDF
            const pdfData = await this.extractTextFromPDF(filePath);
            
            // Split into chunks
            const chunks = this.chunkText(pdfData.text);
            
            // Generate vectors for each chunk
            const vectors = chunks.map((chunk, index) => ({
                id: `pdf_${Date.now()}_${index}`,
                values: this.generateSimpleEmbedding(chunk.text),
                metadata: {
                    userId: userId,
                    fileName: originalName,
                    filePath: filePath,
                    chunkIndex: chunk.index,
                    chunkText: chunk.text,
                    startChar: chunk.startChar,
                    endChar: chunk.endChar,
                    totalPages: pdfData.pages,
                    type: 'pdf_manual',
                    timestamp: new Date().toISOString(),
                    pdfInfo: pdfData.info,
                    pdfMetadata: pdfData.metadata
                }
            }));

            logger.info(`Processed PDF into ${vectors.length} vectors`);
            return {
                vectors,
                pdfData,
                chunks,
                fileName: originalName,
                totalChunks: chunks.length
            };

        } catch (error) {
            logger.error('Failed to process PDF:', error);
            throw error;
        }
    }

    /**
     * Save PDF file to upload directory
     */
    async savePDF(file, userId) {
        try {
            this.ensureUploadDir();

            // Validate file
            const validation = this.validatePDF(file);
            if (!validation.isValid) {
                throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${userId}_${timestamp}_${sanitizedName}`;
            const filePath = path.join(this.uploadPath, fileName);

            // Save file
            fs.writeFileSync(filePath, file.buffer);
            logger.info(`PDF saved: ${filePath}`);

            return {
                fileName: sanitizedName,
                filePath: filePath,
                size: file.size,
                mimeType: file.mimetype
            };

        } catch (error) {
            logger.error('Failed to save PDF:', error);
            throw error;
        }
    }

    /**
     * Delete PDF file
     */
    async deletePDF(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info(`PDF deleted: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to delete PDF:', error);
            throw error;
        }
    }

    /**
     * Get PDF file info
     */
    async getPDFInfo(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }

            const stats = fs.statSync(filePath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                exists: true
            };
        } catch (error) {
            logger.error('Failed to get PDF info:', error);
            throw error;
        }
    }

    /**
     * List all PDFs for a user
     */
    async listUserPDFs(userId) {
        try {
            this.ensureUploadDir();
            
            const files = fs.readdirSync(this.uploadPath);
            const userPDFs = files
                .filter(file => file.startsWith(`${userId}_`) && file.endsWith('.pdf'))
                .map(file => {
                    const filePath = path.join(this.uploadPath, file);
                    const stats = fs.statSync(filePath);
                    return {
                        fileName: file,
                        filePath: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                });

            return userPDFs;
        } catch (error) {
            logger.error('Failed to list user PDFs:', error);
            throw error;
        }
    }
}

module.exports = new PDFService();
