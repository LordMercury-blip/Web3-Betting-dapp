const joi = require('joi');
const { AppError } = require('./errorHandler');

// API Key validation (if needed for admin functions)
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return next(new AppError('API key required', 401));
  }
  
  if (apiKey !== process.env.API_KEY) {
    return next(new AppError('Invalid API key', 401));
  }
  
  next();
};

// Optional: Ethereum signature verification for sensitive operations
const verifyEthereumSignature = async (req, res, next) => {
  try {
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
      return next(new AppError('Address, signature, and message required', 400));
    }
    
    // Verify the signature matches the address
    const { ethers } = require('ethers');
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return next(new AppError('Invalid signature', 401));
    }
    
    // Check message timestamp to prevent replay attacks
    const messageData = JSON.parse(message);
    const messageTimestamp = new Date(messageData.timestamp);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (messageTimestamp < fiveMinutesAgo) {
      return next(new AppError('Message expired', 401));
    }
    
    req.verifiedAddress = address.toLowerCase();
    next();
    
  } catch (error) {
    return next(new AppError('Signature verification failed', 401));
  }
};

module.exports = {
  validateApiKey,
  verifyEthereumSignature
};