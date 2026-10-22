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
