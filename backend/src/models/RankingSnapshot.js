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
  },
  totalUsersFound: {
    type: Number,
    default: 0,
  },
  minimumFollowers: {
    type: Number,
    default: 0,
  },
  candidatesConsidered: {
    type: Number,
    default: 0,
  },
  usersRanked: {
    type: Number,
    default: 0,
  },
  cadence: {
    type: String,
    default: '7-Day Weekly Snapshots',
  },
  dataSource: {
    type: String,
    default: 'GitHub GraphQL API (Direct Verified)',
  },
  rankings: [rankedUserSchema],
}, {
  timestamps: true,
});

// Indexes for performance
rankingSnapshotSchema.index({ regionKey: 1, generatedAt: -1 });
rankingSnapshotSchema.index({ region: 1, generatedAt: -1 });

// Static helper to get the latest snapshot for a region
rankingSnapshotSchema.statics.getLatestForRegion = function(regionKey) {
  const normalizedKey = (regionKey || '').toLowerCase().trim();
  return this.findOne({ regionKey: normalizedKey }).sort({ generatedAt: -1 });
};

module.exports = mongoose.model('RankingSnapshot', rankingSnapshotSchema);
