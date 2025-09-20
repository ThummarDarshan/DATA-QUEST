
// middleware/validation.js
const { body, validationResult } = require('express-validator');

// Validation middleware factory
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors
    });
  };
};

// Common validations
const authValidations = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

const chatValidations = {
  sendMessage: [
    body('sessionId')
      .optional()
      .isUUID()
      .withMessage('Session ID must be a valid UUID'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Message content must be between 1 and 10000 characters')
  ],
  createSession: [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters')
  ]
};

module.exports = {
  validate,
  authValidations,
  chatValidations
};
