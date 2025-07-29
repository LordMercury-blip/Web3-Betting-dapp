const express = require('express');
const joi = require('joi');
const { ethers } = require('ethers');
const BetModel = require('../models/Bet');
const UserModel = require('../models/User');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Import app dependencies - need to handle circular dependency
let redisClient, logger;
setTimeout(() => {
  const app = require('../app');
  redisClient = app.redisClient;
  logger = app.logger;
}, 0);

// Validation schemas
const placeBetSchema = joi.object({
  userAddress: joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  token: joi.string().valid('ETH', 'BTC', 'LINK').required(),
  amount: joi.string().required(),
  direction: joi.string().valid('up', 'down').required(),
  duration: joi.number().valid(300, 900, 3600).required(),
  txHash: joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  startPrice: joi.string().required(),
  commitHash: joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
});

const settleBetSchema = joi.object({
  betId: joi.string().required(),
  endPrice: joi.string().required(),
  isWinner: joi.boolean().required(),
  payout: joi.string().required(),
  txHash: joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
});

// Place bet endpoint
router.post('/place', validateRequest(placeBetSchema), async (req, res) => {
  try {
    const {
      userAddress,
      token,
      amount,
      direction,
      duration,
      txHash,
      startPrice,
      commitHash
    } = req.body;

    // Check if bet with this transaction hash already exists
    const existingBet = await BetModel.findOne({ txHash });
    if (existingBet) {
      return res.status(400).json({
        error: 'Bet with this transaction hash already exists'
      });
    }

    // Create new bet record
    const bet = new BetModel({
      userAddress: userAddress.toLowerCase(),
      token,
      amount,
      direction,
      duration,
      txHash,
      startPrice,
      commitHash,
      startTime: new Date(),
      status: 'active'
    });

    await bet.save();

    // Update user statistics
    await UserModel.findOneAndUpdate(
      { address: userAddress.toLowerCase() },
      {
        $inc: {
          totalBets: 1,
          totalWagered: parseFloat(amount)
        },
        $set: {
          lastBetTime: new Date()
        }
      },
      { upsert: true }
    );

    // Clear relevant caches
    await redisClient.del(`user_bets:${userAddress.toLowerCase()}`);
    await redisClient.del('leaderboard:*');

    logger.info(`Bet placed: ${bet._id} by ${userAddress}`);

    res.status(201).json({
      success: true,
      betId: bet._id,
      message: 'Bet placed successfully'
    });

  } catch (error) {
    logger.error('Error placing bet:', error);
    res.status(500).json({
      error: 'Failed to place bet',
      details: error.message
    });
  }
});

// Settle bet endpoint
router.post('/settle', validateRequest(settleBetSchema), async (req, res) => {
  try {
    const { betId, endPrice, isWinner, payout, txHash } = req.body;

    const bet = await BetModel.findById(betId);
    if (!bet) {
      return res.status(404).json({
        error: 'Bet not found'
      });
    }

    if (bet.status !== 'active') {
      return res.status(400).json({
        error: 'Bet is not active'
      });
    }

    // Update bet record
    bet.endPrice = endPrice;
    bet.isWinner = isWinner;
    bet.payout = payout;
    bet.settleTxHash = txHash;
    bet.status = 'settled';
    bet.settledAt = new Date();

    await bet.save();

    // Update user statistics
    const updateFields = {
      $inc: {
        totalSettled: 1
      }
    };

    if (isWinner) {
      updateFields.$inc.totalWins = 1;
      updateFields.$inc.totalWon = parseFloat(payout);
    }

    await UserModel.findOneAndUpdate(
      { address: bet.userAddress },
      updateFields
    );

    // Clear caches
    await redisClient.del(`user_bets:${bet.userAddress}`);
    await redisClient.del('leaderboard:*');
    await redisClient.del('stats:*');

    logger.info(`Bet settled: ${betId} - Winner: ${isWinner}`);

    res.json({
      success: true,
      message: 'Bet settled successfully'
    });

  } catch (error) {
    logger.error('Error settling bet:', error);
    res.status(500).json({
      error: 'Failed to settle bet',
      details: error.message
    });
  }
});

// Get user bets
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      });
    }

    const normalizedAddress = address.toLowerCase();
    const cacheKey = `user_bets:${normalizedAddress}:${page}:${limit}:${status || 'all'}`;

    // Try to get from cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build query
    const query = { userAddress: normalizedAddress };
    if (status) {
      query.status = status;
    }

    const bets = await BetModel.find(query)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await BetModel.countDocuments(query);

    const result = {
      bets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching user bets:', error);
    res.status(500).json({
      error: 'Failed to fetch user bets',
      details: error.message
    });
  }
});

// Get bet details
router.get('/:betId', async (req, res) => {
  try {
    const { betId } = req.params;

    const bet = await BetModel.findById(betId).lean();
    if (!bet) {
      return res.status(404).json({
        error: 'Bet not found'
      });
    }

    res.json(bet);

  } catch (error) {
    logger.error('Error fetching bet details:', error);
    res.status(500).json({
      error: 'Failed to fetch bet details',
      details: error.message
    });
  }
});

// Get active bets (for monitoring/settlement)
router.get('/active/list', async (req, res) => {
  try {
    const { token, limit = 50 } = req.query;

    const query = { status: 'active' };
    if (token) {
      query.token = token;
    }

    const bets = await BetModel.find(query)
      .sort({ startTime: 1 })
      .limit(limit * 1)
      .lean();

    res.json({
      bets,
      count: bets.length
    });

  } catch (error) {
    logger.error('Error fetching active bets:', error);
    res.status(500).json({
      error: 'Failed to fetch active bets',
      details: error.message
    });
  }
});

module.exports = router;