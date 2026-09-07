const mongoose = require('mongoose');

const rankedUserSchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
  },
  avatarUrl: String,
  location: String,
  totalContributions: {
    type: Number,
    required: true,
    default: 0,
  },
  publicContributions: {
    type: Number,
    default: 0,
  },
  privateContributions: {
    type: Number,
    default: 0,
  },
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
  followers: {
    type: Number,
    default: 0,
  },
  primaryLanguage: String,
  dataQuality: {
    type: String,
    enum: ['verified', 'estimated', 'unverified'],
    default: 'verified',
  },
}, { _id: false });

const rankingSnapshotSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    index: true,
  },
  regionKey: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all_time'],
    default: 'weekly',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true,
