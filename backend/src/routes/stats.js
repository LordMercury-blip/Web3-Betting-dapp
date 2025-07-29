const express = require('express');
const { ethers } = require('ethers');
const BetModel = require('../models/Bet');
const UserModel = require('../models/User');

const router = express.Router();

// Import app dependencies - need to handle circular dependency
let redisClient, logger;
setTimeout(() => {
  const app = require('../app');
  redisClient = app.redisClient;
  logger = app.logger;
}, 0);

// Get global statistics
router.get('/global', async (req, res) => {
  try {
    const cacheKey = 'stats:global';

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Aggregate global stats
    const [
      totalBets,
      totalUsers,
      totalVolume,
      activeBets,
      winRateStats,
      tokenStats,
      recentActivity
    ] = await Promise.all([
      // Total bets
      BetModel.countDocuments(),
      
      // Total users
      UserModel.countDocuments(),
      
      // Total volume
      BetModel.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: { $toDouble: '$amount' } },
            totalPayout: { $sum: { $toDouble: '$payout' } }
          }
        }
      ]),
      
      // Active bets
      BetModel.countDocuments({ status: 'active' }),
      
      // Win rate statistics
      BetModel.aggregate([
        {
          $match: { status: 'settled' }
        },
        {
          $group: {
            _id: null,
            totalSettled: { $sum: 1 },
            totalWins: { $sum: { $cond: ['$isWinner', 1, 0] } }
          }
        }
      ]),
      
      // Token statistics
      BetModel.aggregate([
        {
          $group: {
            _id: '$token',
            count: { $sum: 1 },
            volume: { $sum: { $toDouble: '$amount' } }
          }
        },
        { $sort: { volume: -1 } }
      ]),
      
      // Recent activity (last 24 hours)
      BetModel.aggregate([
        {
          $match: {
            startTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d %H:00:00',
                date: '$startTime'
              }
            },
            count: { $sum: 1 },
            volume: { $sum: { $toDouble: '$amount' } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const globalWinRate = winRateStats[0] ? 
      (winRateStats[0].totalWins / winRateStats[0].totalSettled * 100) : 0;

    const result = {
      totalBets,
      totalUsers,
      totalVolume: totalVolume[0]?.totalVolume || 0,
      totalPayout: totalVolume[0]?.totalPayout || 0,
      activeBets,
      globalWinRate: Math.round(globalWinRate * 100) / 100,
      tokenStats,
      recentActivity,
      lastUpdated: new Date().toISOString()
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching global stats:', error);
    res.status(500).json({
      error: 'Failed to fetch global statistics',
      details: error.message
    });
  }
});

// Get user statistics
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      });
    }

    const normalizedAddress = address.toLowerCase();
    const cacheKey = `stats:user:${normalizedAddress}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get user from database
    const user = await UserModel.findOne({ address: normalizedAddress });
    if (!user) {
      return res.json({
        exists: false,
        message: 'User has not placed any bets yet'
      });
    }

    // Get detailed bet statistics
    const [
      tokenBreakdown,
      durationBreakdown,
      recentPerformance,
      streakInfo
    ] = await Promise.all([
      // Token breakdown
      BetModel.aggregate([
        { $match: { userAddress: normalizedAddress } },
        {
          $group: {
            _id: '$token',
            totalBets: { $sum: 1 },
            wins: { $sum: { $cond: ['$isWinner', 1, 0] } },
            volume: { $sum: { $toDouble: '$amount' } },
            profit: {
              $sum: {
                $subtract: [
                  { $toDouble: '$payout' },
                  { $toDouble: '$amount' }
                ]
              }
            }
          }
        }
      ]),
      
      // Duration breakdown
      BetModel.aggregate([
        { $match: { userAddress: normalizedAddress } },
        {
          $group: {
            _id: '$duration',
            totalBets: { $sum: 1 },
            wins: { $sum: { $cond: ['$isWinner', 1, 0] } }
          }
        }
      ]),
      
      // Recent performance (last 10 bets)
      BetModel.find({ 
        userAddress: normalizedAddress,
        status: 'settled'
      })
        .sort({ settledAt: -1 })
        .limit(10)
        .select('isWinner settledAt')
        .lean(),
      
      // Current streak
      BetModel.find({ 
        userAddress: normalizedAddress,
        status: 'settled'
      })
        .sort({ settledAt: -1 })
        .limit(20)
        .select('isWinner')
        .lean()
    ]);

    // Calculate current streak
    let currentStreak = 0;
    let streakType = null;
    
    if (streakInfo.length > 0) {
      const firstResult = streakInfo[0].isWinner;
      streakType = firstResult ? 'win' : 'loss';
      
      for (const bet of streakInfo) {
        if (bet.isWinner === firstResult) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const result = {
      exists: true,
      address: normalizedAddress,
      basicStats: {
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        winRate: user.totalBets > 0 ? (user.totalWins / user.totalBets * 100) : 0,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        profit: user.totalWon - user.totalWagered
      },
      tokenBreakdown: tokenBreakdown.map(token => ({
        ...token,
        winRate: token.totalBets > 0 ? (token.wins / token.totalBets * 100) : 0
      })),
      durationBreakdown: durationBreakdown.map(duration => ({
        ...duration,
        winRate: duration.totalBets > 0 ? (duration.wins / duration.totalBets * 100) : 0
      })),
      streak: {
        type: streakType,
        length: currentStreak
      },
      recentPerformance,
      lastUpdated: new Date().toISOString()
    };

    // Cache for 2 minutes
    await redisClient.setEx(cacheKey, 120, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Failed to fetch user statistics',
      details: error.message
    });
  }
});

// Get token performance statistics
router.get('/tokens', async (req, res) => {
  try {
    const cacheKey = 'stats:tokens';

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const tokenStats = await BetModel.aggregate([
      {
        $group: {
          _id: '$token',
          totalBets: { $sum: 1 },
          activeBets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          settledBets: {
            $sum: { $cond: [{ $eq: ['$status', 'settled'] }, 1, 0] }
          },
          wins: { $sum: { $cond: ['$isWinner', 1, 0] } },
          totalVolume: { $sum: { $toDouble: '$amount' } },
          totalPayout: { $sum: { $toDouble: '$payout' } },
          upBets: {
            $sum: { $cond: [{ $eq: ['$direction', 'up'] }, 1, 0] }
          },
          downBets: {
            $sum: { $cond: [{ $eq: ['$direction', 'down'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $eq: ['$settledBets', 0] },
              0,
              { $multiply: [{ $divide: ['$wins', '$settledBets'] }, 100] }
            ]
          },
          houseEdge: {
            $cond: [
              { $eq: ['$totalVolume', 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalVolume', '$totalPayout'] },
                      '$totalVolume'
                    ]
                  },
                  100
                ]
              }
            ]
          }
        }
      },
      { $sort: { totalVolume: -1 } }
    ]);

    const result = {
      tokens: tokenStats.map(token => ({
        ...token,
        winRate: Math.round(token.winRate * 100) / 100,
        houseEdge: Math.round(token.houseEdge * 100) / 100
      })),
      lastUpdated: new Date().toISOString()
    };

    // Cache for 10 minutes
    await redisClient.setEx(cacheKey, 600, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching token stats:', error);
    res.status(500).json({
      error: 'Failed to fetch token statistics',
      details: error.message
    });
  }
});

module.exports = router;