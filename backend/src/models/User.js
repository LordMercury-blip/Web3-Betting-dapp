const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  totalBets: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWins: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWagered: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWon: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSettled: {
    type: Number,
    default: 0,
    min: 0
  },
  lastBetTime: {
    type: Date,
    default: null
  },
  // Rate limiting fields
  betsToday: {
    type: Number,
    default: 0,
    min: 0
  },
  lastBetDay: {
    type: Date,
    default: null
  },
  // User preferences (optional)
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    }
  },
  // Analytics tracking
  firstBetTime: {
    type: Date,
    default: null
  },
  referrer: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  indexes: [
    { address: 1 },
    { totalWagered: -1 },
    { lastBetTime: -1 }
  ]
});

// Virtual fields
userSchema.virtual('winRate').get(function() {
  return this.totalBets > 0 ? (this.totalWins / this.totalBets) * 100 : 0;
});

userSchema.virtual('profit').get(function() {
  return this.totalWon - this.totalWagered;
});

userSchema.virtual('averageBetSize').get(function() {
  return this.totalBets > 0 ? this.totalWagered / this.totalBets : 0;
});

// Include virtuals when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Reset daily bet counter if it's a new day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.lastBetDay || this.lastBetDay < today) {
    this.betsToday = 0;
    this.lastBetDay = today;
  }
  
  // Set first bet time if this is the first bet
  if (this.totalBets === 1 && !this.firstBetTime) {
    this.firstBetTime = this.lastBetTime || new Date();
  }
  
  next();
});

// Instance methods
userSchema.methods.canPlaceBet = function() {
  const maxBetsPerDay = 100; // Configurable limit
  return this.betsToday < maxBetsPerDay;
};

userSchema.methods.incrementBetCount = function() {
  this.totalBets += 1;
  this.betsToday += 1;
  this.lastBetTime = new Date();
  
  // Reset counter if it's a new day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.lastBetDay || this.lastBetDay < today) {
    this.betsToday = 1;
    this.lastBetDay = today;
  }
};

// Static methods
userSchema.statics.getTopUsers = function(limit = 10, sortBy = 'winRate') {
  const sortCriteria = {};
  
  switch (sortBy) {
    case 'totalWon':
      sortCriteria.totalWon = -1;
      break;
    case 'totalBets':
      sortCriteria.totalBets = -1;
      break;
    case 'profit':
      // This requires aggregation since profit is a virtual field
      return this.aggregate([
        { $match: { totalBets: { $gte: 5 } } },
        {
          $addFields: {
            winRate: {
              $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100]
            },
            profit: { $subtract: ['$totalWon', '$totalWagered'] }
          }
        },
        { $sort: { profit: -1 } },
        { $limit: limit }
      ]);
    default: // winRate
      return this.aggregate([
        { $match: { totalBets: { $gte: 5 } } },
        {
          $addFields: {
            winRate: {
              $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100]
            }
          }
        },
        { $sort: { winRate: -1, totalBets: -1 } },
        { $limit: limit }
      ]);
  }
  
  return this.find({ totalBets: { $gte: 5 } })
    .sort(sortCriteria)
    .limit(limit);
};

userSchema.statics.getUserRank = async function(address, sortBy = 'winRate') {
  const user = await this.findOne({ address: address.toLowerCase() });
  if (!user || user.totalBets < 5) {
    return null;
  }
  
  let betterUsersCount;
  const userWinRate = (user.totalWins / user.totalBets) * 100;
  
  switch (sortBy) {
    case 'totalWon':
      betterUsersCount = await this.countDocuments({
        totalBets: { $gte: 5 },
        totalWon: { $gt: user.totalWon }
      });
      break;
    case 'totalBets':
      betterUsersCount = await this.countDocuments({
        totalBets: { $gt: user.totalBets }
      });
      break;
    case 'profit':
      betterUsersCount = await this.countDocuments({
        totalBets: { $gte: 5 },
        $expr: {
          $gt: [
            { $subtract: ['$totalWon', '$totalWagered'] },
            user.totalWon - user.totalWagered
          ]
        }
      });
      break;
    default: // winRate
      betterUsersCount = await this.countDocuments({
        totalBets: { $gte: 5 },
        $expr: {
          $gt: [
            { $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100] },
            userWinRate
          ]
        }
      });
      break;
  }
  
  return betterUsersCount + 1;
};

module.exports = mongoose.model('User', userSchema);