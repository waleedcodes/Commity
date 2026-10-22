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
