const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Reference to user (optional for daily/timeline records)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  githubUsername: {
    type: String,
    index: true,
  },
  // Alias for compatibility
  username: {
    type: String,
    index: true,
  },
  
  // Date for daily records
  date: {
    type: Date,
    index: true,
  },
  
  // Time period for analytics
  period: {
    type: String,
    enum: ['1d', '7d', '30d', '90d', '365d', 'all_time', 'daily', 'weekly', 'monthly', 'yearly'],
    default: '30d',
    index: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  endDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  // Direct metric fields for quick queries
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
  additions: {
    type: Number,
    default: 0,
  },
  deletions: {
    type: Number,
    default: 0,
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
analyticsSchema.index({ githubUsername: 1, period: 1 });
analyticsSchema.index({ username: 1, period: 1 });
analyticsSchema.index({ githubUsername: 1, date: -1 });
analyticsSchema.index({ username: 1, date: -1 });
analyticsSchema.index({ userId: 1, period: 1, startDate: -1 });
analyticsSchema.index({ startDate: -1, endDate: -1 });
analyticsSchema.index({ 'contributions.total': -1 });
analyticsSchema.index({ lastCalculatedAt: 1 });

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
