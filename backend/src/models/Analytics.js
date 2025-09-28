const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Reference to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  githubUsername: {
    type: String,
    required: true,
    index: true,
  },
  
  // Time period for analytics
  period: {
    type: String,
    enum: ['1d', '7d', '30d', '90d', '365d', 'all_time', 'daily', 'weekly', 'monthly', 'yearly'], // Support both new and legacy formats
    required: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  
  // Contribution metrics
  contributions: {
    commits: {
      type: Number,
      default: 0,
    },
    pullRequests: {
      type: Number,
      default: 0,
    },
    issues: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  
  // Repository metrics
  repositories: {
    created: {
      type: Number,
      default: 0,
    },
    forked: {
      type: Number,
      default: 0,
    },
    starred: {
      type: Number,
      default: 0,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    totalForks: {
      type: Number,
      default: 0,
    },
  },
  
  // Language statistics
  languages: [{
    name: {
      type: String,
      required: true,
    },
    bytes: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    commits: {
      type: Number,
      default: 0,
    },
  }],
  
  // Activity patterns
  activityPatterns: {
    byHour: [{
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
    byDayOfWeek: [{
      day: {
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday, 6 = Saturday
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
    byMonth: [{
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
  },
  
  // Collaboration metrics
  collaboration: {
    uniqueRepositories: {
      type: Number,
      default: 0,
    },
    uniqueCollaborators: {
      type: Number,
      default: 0,
    },
    organizationContributions: {
      type: Number,
      default: 0,
    },
    openSourceContributions: {
      type: Number,
      default: 0,
    },
  },
  
  // Streak information
  streaks: {
    current: {
      type: Number,
      default: 0,
    },
    longest: {
      type: Number,
      default: 0,
    },
    longestStartDate: Date,
    longestEndDate: Date,
  },
  
  // Achievement metrics
  achievements: [{
    type: {
      type: String,
      enum: [
        'first_commit',
        'first_pr',
        'first_issue',
        'commit_streak_7',
        'commit_streak_30',
        'commit_streak_100',
        'repo_star_10',
        'repo_star_100',
        'repo_star_1000',
        'follower_milestone_10',
        'follower_milestone_100',
        'follower_milestone_1000',
        'language_polyglot',
        'early_adopter',
        'consistent_contributor',
      ],
    },
    achievedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: mongoose.Schema.Types.Mixed,
  }],
  
  // Performance metrics
  performance: {
    averageCommitsPerDay: {
      type: Number,
      default: 0,
    },
    averagePRsPerWeek: {
      type: Number,
      default: 0,
    },
    averageIssuesPerMonth: {
      type: Number,
      default: 0,
    },
    productivityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  
  // Social metrics
  social: {
    followersGained: {
      type: Number,
      default: 0,
    },
    followingAdded: {
      type: Number,
      default: 0,
    },
    networkGrowth: {
      type: Number,
      default: 0,
    },
  },
  
  // Data freshness
  lastCalculatedAt: {
    type: Date,
    default: Date.now,
  },
  calculationDuration: {
    type: Number, // in milliseconds
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
analyticsSchema.index({ userId: 1, period: 1, startDate: -1 });
analyticsSchema.index({ githubUsername: 1, period: 1 });
analyticsSchema.index({ startDate: -1, endDate: -1 });
analyticsSchema.index({ 'contributions.total': -1 });
analyticsSchema.index({ lastCalculatedAt: 1 });

// Compound indexes
analyticsSchema.index({ 
  userId: 1, 
  period: 1, 
  startDate: -1 
}, { unique: true });

// Virtual for total activity score
analyticsSchema.virtual('activityScore').get(function() {
  const weights = {
    commits: 1,
    pullRequests: 3,
    issues: 2,
    reviews: 2,
  };
  
  return Object.entries(this.contributions).reduce((score, [key, value]) => {
    if (weights[key]) {
      return score + (value * weights[key]);
    }
    return score;
  }, 0);
});

// Virtual for contribution diversity
analyticsSchema.virtual('contributionDiversity').get(function() {
  const contributions = this.contributions;
  const total = contributions.total || 1;
  
  const distribution = [
    contributions.commits / total,
    contributions.pullRequests / total,
    contributions.issues / total,
    contributions.reviews / total,
  ].filter(val => val > 0);
  
  // Calculate Shannon diversity index
  const diversity = -distribution.reduce((sum, p) => sum + (p * Math.log(p)), 0);
  return Math.round(diversity * 100) / 100;
});

// Static methods
analyticsSchema.statics.getAnalyticsByPeriod = function(userId, period, startDate, endDate) {
  const query = { userId, period };
  
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate) };
    query.endDate = { $lte: new Date(endDate) };
  }
  
  return this.find(query).sort({ startDate: -1 });
};

analyticsSchema.statics.getTopPerformers = function(period = '30d', metric = 'contributions.total', limit = 10) {
  return this.aggregate([
    { $match: { period } },
    { $sort: { [metric]: -1, startDate: -1 } },
    { $group: {
      _id: '$userId',
      username: { $first: '$githubUsername' },
      bestPerformance: { $first: `$${metric}` },
      latestData: { $first: '$$ROOT' }
    }},
    { $sort: { bestPerformance: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $project: {
      username: 1,
      bestPerformance: 1,
      'user.name': 1,
      'user.avatarUrl': 1,
      'user.location': 1,
      latestData: 1
    }}
  ]);
};

analyticsSchema.statics.calculateTrends = function(userId, metric = 'contributions.total', periods = 6) {
  return this.aggregate([
    { $match: { 
      userId: new mongoose.Types.ObjectId(userId),
      period: '30d'
    }},
    { $sort: { startDate: -1 } },
    { $limit: periods },
    { $project: {
      period: '$startDate',
      value: `$${metric}`,
      _id: 0
    }},
    { $sort: { period: 1 } }
  ]);
};

// Instance methods
analyticsSchema.methods.calculatePerformanceScore = function() {
  const maxValues = {
    commits: 100,
    pullRequests: 20,
    issues: 30,
    reviews: 25,
  };
  
  let score = 0;
  let maxScore = 0;
  
  Object.entries(maxValues).forEach(([key, max]) => {
    const value = this.contributions[key] || 0;
    score += Math.min(value / max, 1) * 25; // Each category worth 25 points
    maxScore += 25;
  });
  
  this.performance.productivityScore = Math.round((score / maxScore) * 100);
  return this.performance.productivityScore;
};

analyticsSchema.methods.updateAverages = function() {
  const daysInPeriod = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  const weeksInPeriod = Math.ceil(daysInPeriod / 7);
  const monthsInPeriod = Math.ceil(daysInPeriod / 30);
  
  this.performance.averageCommitsPerDay = this.contributions.commits / daysInPeriod;
  this.performance.averagePRsPerWeek = this.contributions.pullRequests / weeksInPeriod;
  this.performance.averageIssuesPerMonth = this.contributions.issues / monthsInPeriod;
  
  return this.performance;
};

// Pre-save middleware
analyticsSchema.pre('save', function(next) {
  // Calculate total contributions
  this.contributions.total = 
    this.contributions.commits + 
    this.contributions.pullRequests + 
    this.contributions.issues + 
    this.contributions.reviews;
  
  // Update performance metrics
  this.calculatePerformanceScore();
  this.updateAverages();
  
  next();
});

module.exports = mongoose.model('Analytics', analyticsSchema);
