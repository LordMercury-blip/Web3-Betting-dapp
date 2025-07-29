const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  token: {
    type: String,
    required: true,
    enum: ['ETH', 'BTC', 'LINK']
  },
  amount: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    required: true,
    enum: ['up', 'down']
  },
  duration: {
    type: Number,
    required: true,
    enum: [300, 900, 3600] // 5min, 15min, 1hour in seconds
  },
  startPrice: {
    type: String,
    required: true
  },
  endPrice: {
    type: String,
    default: null
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  settledAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'settled', 'cancelled'],
    default: 'active'
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  payout: {
    type: String,
    default: '0'
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    match: /^0x[a-fA-F0-9]{64}$/
  },
  settleTxHash: {
    type: String,
    default: null,
    match: /^0x[a-fA-F0-9]{64}$/
  },
  commitHash: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{64}$/
  },
  revealed: {
    type: Boolean,
    default: false
  },
  revealTxHash: {
    type: String,
    default: null,
    match: /^0x[a-fA-F0-9]{64}$/
  }
}, {
  timestamps: true,
  indexes: [
    { userAddress: 1, startTime: -1 },
    { status: 1, startTime: 1 },
    { token: 1, status: 1 },
    { txHash: 1 }
  ]
});

// Pre-save middleware to ensure data consistency
betSchema.pre('save', function(next) {
  // Ensure amount and payout are valid numbers when converted
  try {
    parseFloat(this.amount);
    if (this.payout) {
      parseFloat(this.payout);
    }
    next();
  } catch (error) {
    next(new Error('Invalid amount or payout value'));
  }
});

// Instance methods
betSchema.methods.isExpired = function() {
  const expirationTime = new Date(this.startTime.getTime() + (this.duration * 1000));
  return new Date() > expirationTime;
};

betSchema.methods.timeRemaining = function() {
  const expirationTime = new Date(this.startTime.getTime() + (this.duration * 1000));
  const remaining = expirationTime.getTime() - Date.now();
  return Math.max(0, remaining);
};

// Static methods
betSchema.statics.findActiveExpired = function() {
  return this.find({
    status: 'active',
    $expr: {
      $lt: [
        { $add: ['$startTime', { $multiply: ['$duration', 1000] }] },
        new Date()
      ]
    }
  });
};

betSchema.statics.getUserStats = async function(userAddress) {
  const stats = await this.aggregate([
    { $match: { userAddress: userAddress.toLowerCase() } },
    {
      $group: {
        _id: null,
        totalBets: { $sum: 1 },
        totalWins: { $sum: { $cond: ['$isWinner', 1, 0] } },
        totalWagered: { $sum: { $toDouble: '$amount' } },
        totalWon: { $sum: { $toDouble: '$payout' } },
        activeBets: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalBets: 0,
      totalWins: 0,
      totalWagered: 0,
      totalWon: 0,
      activeBets: 0,
      winRate: 0,
      profit: 0
    };
  }

  const result = stats[0];
  result.winRate = result.totalBets > 0 ? (result.totalWins / result.totalBets) * 100 : 0;
  result.profit = result.totalWon - result.totalWagered;

  return result;
};

module.exports = mongoose.model('Bet', betSchema);