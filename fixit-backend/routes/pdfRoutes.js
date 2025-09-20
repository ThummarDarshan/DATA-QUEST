const express = require('express');
const multer = require('multer');
const router = express.Router();
const PDFController = require('../controllers/pdfController');
const auth = require('../middleware/auth');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

/**
 * PDF Routes
 * All routes require authentication
 */

// Upload PDF
router.post('/upload', auth, upload.single('pdf'), PDFController.uploadPDF);

// Search PDFs
router.post('/search', auth, PDFController.searchPDFs);

// List user's PDFs
router.get('/list', auth, PDFController.listPDFs);

// Get PDF details
router.get('/details/:fileName', auth, PDFController.getPDFDetails);

// Delete PDF
router.delete('/delete/:fileName', auth, PDFController.deletePDF);

// Get PDF statistics
router.get('/stats', auth, PDFController.getPDFStats);

module.exports = router;
