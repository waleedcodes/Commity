// [Commity Core Phase 1: Setup] User.js
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
userSchema.index({ isActive: 1, totalContributions: -1 });
userSchema.index({ isActive: 1, totalCommits: -1 });
userSchema.index({ isActive: 1, followers: -1 });
userSchema.index({ isActive: 1, publicRepos: -1 });
userSchema.index({ isActive: 1, longestStreak: -1 });
userSchema.index({ isActive: 1, location: 1, totalContributions: -1 });
userSchema.index({ isActive: 1, 'topLanguages.name': 1, totalContributions: -1 });
userSchema.index({ isActive: 1, lastAnalyticsUpdate: -1 });

// Virtual for GitHub login alias
userSchema.virtual('login').get(function() {
  return this.username;
});

// Virtual for currentStreak alias
userSchema.virtual('currentStreak')
  .get(function() {
    return this.contributionStreak;
  })
  .set(function(value) {
    this.contributionStreak = value;
  });

// Virtual for account age in days
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.githubCreatedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const fields = ['name', 'bio', 'company', 'location', 'blog', 'email'];
  
  fields.forEach(field => {
    if (this[field] && this[field].trim()) {
      completion += 1;
    }
  });
  
  return Math.round((completion / fields.length) * 100);
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Always preserve true annual contribution count from GitHub GraphQL if provided,
  // falling back to sum of components if not set or smaller
  const calculatedSum = (this.totalCommits || 0) + 
                        (this.totalPullRequests || 0) + 
                        (this.totalIssues || 0) + 
                        (this.totalReviews || 0);

  if (!this.totalContributions || this.totalContributions < calculatedSum) {
    this.totalContributions = calculatedSum;
  }

  // Update timestamps if analytics data changed
  if (this.isModified('totalCommits') || this.isModified('totalPullRequests') || 
      this.isModified('totalIssues') || this.isModified('totalReviews') ||
      this.isModified('totalContributions')) {
    this.lastFetchedAt = new Date();
    this.lastAnalyticsUpdate = new Date();
  }
  
  next();
});

// Static methods
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByGitHubId = function(githubId) {
  return this.findOne({ githubId });
};

userSchema.statics.getLeaderboard = function(category = 'totalCommits', limit = 100, location = null) {
  const query = { isActive: true };
  
  if (location) {
    query.location = new RegExp(location, 'i');
  }
  
  return this.find(query)
    .sort({ [category]: -1 })
    .limit(limit)
    .select('-contributionCalendar -recentRepos');
};

// Instance methods
userSchema.methods.updateRank = async function(category = 'totalCommits') {
  const rank = await this.constructor.countDocuments({
    [category]: { $gt: this[category] },
    isActive: true,
  }) + 1;
  
  this.globalRank = rank;
  return rank;
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject({ virtuals: true });
  
  // Provide compatibility aliases
  obj.login = obj.username;
  obj.currentStreak = obj.contributionStreak || 0;
  
  // Remove sensitive information
  delete obj.email;
  delete obj.__v;
  
  return obj;
};

module.exports = mongoose.model('User', userSchema);
