// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, generateUniqueFilename } = require('../utils/helpers');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|md/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter
});

// All upload routes require authentication
router.use(authenticateToken);

// @desc    Upload single file
// @route   POST /api/upload/file
// @access  Private
router.post('/file', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl
    }
  });
}));

// @desc    Upload and resize image (for avatars)
// @route   POST /api/upload/avatar
// @access  Private
router.post('/avatar', upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image uploaded'
    });
  }

  // Resize image for avatar (200x200)
  const outputPath = path.join(path.dirname(req.file.path), `avatar-${req.file.filename}`);
  
  await sharp(req.file.path)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(outputPath);
// Continuation of routes/uploadRoutes.js (completing the avatar upload route)

// Delete original file
await fs.unlink(req.file.path);

const avatarUrl = `/uploads/avatar-${req.file.filename}`;

res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
        filename: `avatar-${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
        url: avatarUrl
    }
});
}));

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private
router.delete('/:filename', asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', filename);

    try {
        await fs.access(filePath);
        await fs.unlink(filePath);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
}));

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files'
            });
        }
    }

    if (error.message === 'Invalid file type') {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only images and documents are allowed.'
        });
    }

    next(error);
});

module.exports = router;
