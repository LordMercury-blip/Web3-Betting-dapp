const joi = require('joi');

// Request validation middleware factory
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorMessage,
        fields: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  ethereumAddress: joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  transactionHash: joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  positiveNumber: joi.number().positive().required(),
  pagination: joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(20)
  })
};

module.exports = {
  validateRequest,
  commonSchemas
};