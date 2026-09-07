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
