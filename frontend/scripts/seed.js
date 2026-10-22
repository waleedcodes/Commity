const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const Analytics = require('../src/models/Analytics');
const githubService = require('../src/services/githubService');
const logger = require('../src/utils/logger');

// Seed profiles dataset with realistic data (used directly or as fallback when API rate-limited)
const SEED_USERS = [
  {
    githubId: 1024025,
    username: 'torvalds',
    name: 'Linus Torvalds',
    bio: 'Creator of Linux and Git',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    htmlUrl: 'https://github.com/torvalds',
    company: 'Linux Foundation',
    location: 'Portland, OR',
    blog: 'https://kernel.org',
    twitterUsername: null,
    publicRepos: 7,
    publicGists: 0,
    followers: 245000,
    following: 0,
    githubCreatedAt: new Date('2011-09-03T15:26:22Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 8420,
    totalPullRequests: 142,
    totalIssues: 85,
    totalReviews: 620,
    totalContributions: 9267,
    contributionStreak: 45,
    longestStreak: 210,
    topLanguages: [
      { name: 'C', percentage: 94.5, bytes: 48500000, color: '#555555' },
      { name: 'Shell', percentage: 3.8, bytes: 1950000, color: '#89e051' },
      { name: 'Makefile', percentage: 1.7, bytes: 870000, color: '#427819' }
    ],
    repositories: [
      { name: 'linux', description: 'Linux kernel source tree', htmlUrl: 'https://github.com/torvalds/linux', stars: 182000, forks: 54000, language: 'C', updatedAt: new Date() },
      { name: 'pesconvert', description: 'Convert Brother PES embroidery files', htmlUrl: 'https://github.com/torvalds/pesconvert', stars: 1200, forks: 140, language: 'C', updatedAt: new Date() }
    ]
  },
  {
    githubId: 810438,
    username: 'gaearon',
    name: 'Dan Abramov',
    bio: 'Co-author of Redux and Create React App. Building bluesky & react.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/810438?v=4',
    htmlUrl: 'https://github.com/gaearon',
    company: 'Bluesky',
    location: 'London, UK',
    blog: 'https://overreacted.io',
    twitterUsername: 'dan_abramov',
    publicRepos: 270,
    publicGists: 80,
    followers: 91000,
    following: 172,
    githubCreatedAt: new Date('2011-05-25T18:18:31Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 5210,
    totalPullRequests: 980,
    totalIssues: 450,
    totalReviews: 1250,
    totalContributions: 7890,
    contributionStreak: 28,
    longestStreak: 180,
    topLanguages: [
      { name: 'JavaScript', percentage: 65.2, bytes: 14500000, color: '#f1e05a' },
      { name: 'TypeScript', percentage: 28.5, bytes: 6350000, color: '#3178c6' },
      { name: 'CSS', percentage: 6.3, bytes: 1400000, color: '#1572B6' }
    ],
    repositories: [
      { name: 'redux', description: 'Predictable state container for JavaScript apps', htmlUrl: 'https://github.com/reduxjs/redux', stars: 60500, forks: 15400, language: 'TypeScript', updatedAt: new Date() },
      { name: 'overreacted.io', description: 'Personal blog by Dan Abramov', htmlUrl: 'https://github.com/gaearon/overreacted.io', stars: 6800, forks: 1200, language: 'JavaScript', updatedAt: new Date() }
    ]
  },
  {
    githubId: 499550,
    username: 'yyx990803',
    name: 'Evan You',
    bio: 'Creator of Vue.js and Vite.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/499550?v=4',
    htmlUrl: 'https://github.com/yyx990803',
    company: 'Vue / Vite',
    location: 'Singapore',
    blog: 'https://evanyou.me',
    twitterUsername: 'youyuxi',
    publicRepos: 185,
    publicGists: 70,
    followers: 104000,
    following: 95,
    githubCreatedAt: new Date('2010-11-28T01:05:40Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 7120,
    totalPullRequests: 840,
    totalIssues: 610,
    totalReviews: 1890,
    totalContributions: 10460,
    contributionStreak: 52,
    longestStreak: 320,
    topLanguages: [
      { name: 'TypeScript', percentage: 72.4, bytes: 21500000, color: '#3178c6' },
      { name: 'JavaScript', percentage: 22.1, bytes: 6560000, color: '#f1e05a' },
      { name: 'HTML', percentage: 5.5, bytes: 1630000, color: '#e34c26' }
    ],
    repositories: [
      { name: 'vue', description: 'The progressive JavaScript framework', htmlUrl: 'https://github.com/vuejs/core', stars: 46000, forks: 8200, language: 'TypeScript', updatedAt: new Date() },
      { name: 'vite', description: 'Next generation frontend tooling', htmlUrl: 'https://github.com/vitejs/vite', stars: 71000, forks: 6300, language: 'TypeScript', updatedAt: new Date() }
    ]
  },
  {
    githubId: 11247099,
    username: 'antfu',
    name: 'Anthony Fu',
    bio: 'A ship in harbor is safe, but that is not what ships are built for.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/11247099?v=4',
    htmlUrl: 'https://github.com/antfu',
    company: 'NuxtLabs',
    location: 'Tokyo, Japan',
    blog: 'https://antfu.me',
    twitterUsername: 'antfu7',
    publicRepos: 480,
    publicGists: 110,
    followers: 43000,
    following: 110,
    githubCreatedAt: new Date('2015-02-27T08:35:14Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 9850,
    totalPullRequests: 2100,
    totalIssues: 790,
    totalReviews: 2450,
    totalContributions: 15190,
    contributionStreak: 94,
    longestStreak: 410,
    topLanguages: [
      { name: 'TypeScript', percentage: 88.2, bytes: 34000000, color: '#3178c6' },
      { name: 'Vue', percentage: 8.5, bytes: 3280000, color: '#41b883' },
      { name: 'JavaScript', percentage: 3.3, bytes: 1270000, color: '#f1e05a' }
    ],
    repositories: [
      { name: 'unocss', description: 'The instant on-demand atomic CSS engine', htmlUrl: 'https://github.com/unocss/unocss', stars: 17200, forks: 950, language: 'TypeScript', updatedAt: new Date() },
      { name: 'vueuse', description: 'Collection of essential Vue Composition Utilities', htmlUrl: 'https://github.com/vueuse/vueuse', stars: 21000, forks: 2900, language: 'TypeScript', updatedAt: new Date() }
    ]
  },
