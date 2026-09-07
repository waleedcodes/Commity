// [Commity Core Phase 2: Logic] User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // GitHub user information
  githubId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  email: {
    type: String,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  avatarUrl: {
    type: String,
    required: true,
  },
  htmlUrl: {
    type: String,
    required: true,
  },
  
  // Profile information
  company: String,
  location: String,
  blog: String,
  twitterUsername: String,
  
  // GitHub statistics
  publicRepos: {
    type: Number,
    default: 0,
  },
  publicGists: {
    type: Number,
    default: 0,
  },
  followers: {
    type: Number,
    default: 0,
  },
  following: {
    type: Number,
    default: 0,
  },
  
  // Account information
  githubCreatedAt: {
    type: Date,
    required: true,
  },
  githubUpdatedAt: {
    type: Date,
    required: true,
  },
  
  // Analytics data
  totalCommits: {
    type: Number,
    default: 0,
  },
  totalPullRequests: {
    type: Number,
    default: 0,
  },
  totalIssues: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  totalContributions: {
    type: Number,
    default: 0,
    index: true,
  },
  publicContributions: {
    type: Number,
    default: 0,
    index: true,
  },
  privateContributions: {
    type: Number,
    default: 0,
  },
  contributionStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  
  // Contribution activity (last 365 days)
  contributionCalendar: [{
    date: {
      type: Date,
      required: true,
    },
    contributionCount: {
      type: Number,
      default: 0,
    },
    contributionLevel: {
      type: String,
      enum: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'],
      default: 'NONE',
    },
  }],
  
  // Top languages
  topLanguages: [{
    name: {
      type: String,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bytes: Number,
    color: String,
  }],
  
  // Recent repositories
  recentRepos: [{
    name: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    description: String,
    stargazersCount: {
      type: Number,
      default: 0,
    },
    forksCount: {
      type: Number,
      default: 0,
    },
    language: String,
    updatedAt: Date,
    htmlUrl: String,
  }],
  
  // Ranking information
  globalRank: {
    type: Number,
    index: true,
  },
  countryRank: Number,
  cityRank: Number,
  
  // Last data fetch & analytics
  lastFetchedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastAnalyticsUpdate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  // Application metadata
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  accountType: {
    type: String,
    enum: ['User', 'Organization'],
    default: 'User',
    index: true,
  },
  contributionSource: {
    type: String,
    enum: ['github_graphql', 'github_rest', 'unverified'],
    default: 'github_graphql',
  },
  dataQuality: {
    type: String,
    enum: ['verified', 'estimated', 'unverified'],
    default: 'verified',
  },
  statsUpdatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ githubId: 1 });
userSchema.index({ totalCommits: -1 });
userSchema.index({ totalContributions: -1 });
userSchema.index({ followers: -1 });
userSchema.index({ globalRank: 1 });
userSchema.index({ location: 1 });
userSchema.index({ lastFetchedAt: 1 });
userSchema.index({ lastAnalyticsUpdate: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// High performance compound indexes for scaling leaderboards & queries
