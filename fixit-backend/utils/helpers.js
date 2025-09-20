// utils/helpers.js
const crypto = require('crypto');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const generateSessionTitle = (firstMessage) => {
  if (!firstMessage) return 'New Chat';
  
  const words = firstMessage.trim().split(' ');
  const title = words.slice(0, 6).join(' ');
  
  return title.length > 40 ? title.substring(0, 37) + '...' : title;
};

const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
};

module.exports = {
  asyncHandler,
  generateUniqueFilename,
  formatFileSize,
  sanitizeInput,
  generateSessionTitle,
  calculateReadingTime
};