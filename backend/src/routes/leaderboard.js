const express = require('express');
const { ethers } = require('ethers');
const UserModel = require('../models/User');

const router = express.Router();

// Import app dependencies - need to handle circular dependency
let redisClient, logger;
setTimeout(() => {
  const app = require('../app');
  redisClient = app.redisClient;
  logger = app.logger;
}, 0);

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { 
      timeframe = 'all', 
      sortBy = 'winRate', 
      limit = 50,
      page = 1 
    } = req.query;

    const cacheKey = `leaderboard:${timeframe}:${sortBy}:${page}:${limit}`;

    // Try to get from cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build aggregation pipeline
    const matchStage = { totalBets: { $gt: 0 } };
    
    // Add time filtering for non-'all' timeframes
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        matchStage.lastBetTime = { $gte: startDate };
      }
    }

    // Define sort criteria
    const sortCriteria = {};
    switch (sortBy) {
      case 'winRate':
        sortCriteria.winRate = -1;
        sortCriteria.totalBets = -1; // Secondary sort
        break;
      case 'totalWon':
        sortCriteria.totalWon = -1;
        break;
      case 'totalBets':
        sortCriteria.totalBets = -1;
        break;
      case 'profit':
        sortCriteria.profit = -1;
        break;
      default:
        sortCriteria.winRate = -1;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $eq: ['$totalBets', 0] },
              0,
              { $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100] }
            ]
          },
          profit: { $subtract: ['$totalWon', '$totalWagered'] }
        }
      },
      {
        $match: {
          totalBets: { $gte: 5 } // Minimum 5 bets to appear on leaderboard
        }
      },
      { $sort: sortCriteria },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $project: {
          address: 1,
          totalBets: 1,
          totalWins: 1,
          totalWagered: 1,
          totalWon: 1,
          winRate: { $round: ['$winRate', 2] },
          profit: { $round: ['$profit', 4] },
          lastBetTime: 1,
          createdAt: 1
        }
      }
    ];

    const leaderboard = await UserModel.aggregate(pipeline);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: (page - 1) * limit + index + 1,
      // Anonymize addresses for privacy
      displayAddress: `${user.address.slice(0, 6)}...${user.address.slice(-4)}`,
      // Add random avatar for fun
      avatar: getRandomAvatar(user.address)
    }));

    // Get total count for pagination
    const totalCountPipeline = [
      { $match: matchStage },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $eq: ['$totalBets', 0] },
              0,
              { $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100] }
            ]
          }
        }
      },
      {
        $match: {
          totalBets: { $gte: 5 }
        }
      },
      { $count: 'total' }
    ];

    const totalResult = await UserModel.aggregate(totalCountPipeline);
    const total = totalResult[0]?.total || 0;

    const result = {
      leaderboard: rankedLeaderboard,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      timeframe,
      sortBy
    };

    // Cache for 2 minutes
    await redisClient.setEx(cacheKey, 120, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      details: error.message
    });
  }
});

// Get user rank
router.get('/rank/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = 'all' } = req.query;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      });
    }

    const normalizedAddress = address.toLowerCase();
    const cacheKey = `user_rank:${normalizedAddress}:${timeframe}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get user stats
    const user = await UserModel.findOne({ address: normalizedAddress });
    if (!user || user.totalBets < 5) {
      return res.json({
        rank: null,
        message: 'User not found or insufficient bets for ranking'
      });
    }

    const userWinRate = user.totalBets > 0 ? (user.totalWins / user.totalBets) * 100 : 0;

    // Count users with better stats
    const matchStage = {
      totalBets: { $gte: 5 },
      $expr: {
        $gt: [
          {
            $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100]
          },
          userWinRate
        ]
      }
    };

    const betterUsersCount = await UserModel.countDocuments(matchStage);
    const rank = betterUsersCount + 1;

    const result = {
      rank,
      user: {
        address: normalizedAddress,
        displayAddress: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        winRate: Math.round(userWinRate * 100) / 100,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        profit: user.totalWon - user.totalWagered
      }
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching user rank:', error);
    res.status(500).json({
      error: 'Failed to fetch user rank',
      details: error.message
    });
  }
});

// Helper function to generate consistent random avatars
function getRandomAvatar(address) {
  const avatars = ['🦄', '🚀', '⚡', '🔥', '💎', '🎯', '🏆', '⭐', '🌟', '💫'];
  const hash = parseInt(address.slice(-4), 16);
  return avatars[hash % avatars.length];
}

module.exports = router;