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
  {
    githubId: 170270,
    username: 'sindresorhus',
    name: 'Sindre Sorhus',
    bio: 'Full-time open-sourcerer & maker of apps and CLI tools',
    avatarUrl: 'https://avatars.githubusercontent.com/u/170270?v=4',
    htmlUrl: 'https://github.com/sindresorhus',
    company: null,
    location: 'Paris, France',
    blog: 'https://sindresorhus.com',
    twitterUsername: 'sindresorhus',
    publicRepos: 1120,
    publicGists: 95,
    followers: 61500,
    following: 34,
    githubCreatedAt: new Date('2009-12-20T20:47:08Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 14500,
    totalPullRequests: 3200,
    totalIssues: 1800,
    totalReviews: 2900,
    totalContributions: 22400,
    contributionStreak: 120,
    longestStreak: 580,
    topLanguages: [
      { name: 'JavaScript', percentage: 61.0, bytes: 24000000, color: '#f1e05a' },
      { name: 'TypeScript', percentage: 29.0, bytes: 11400000, color: '#3178c6' },
      { name: 'Swift', percentage: 10.0, bytes: 3900000, color: '#F05138' }
    ],
    repositories: [
      { name: 'awesome', description: 'Awesome lists about all kinds of interesting topics', htmlUrl: 'https://github.com/sindresorhus/awesome', stars: 330000, forks: 29000, language: 'Markdown', updatedAt: new Date() },
      { name: 'got', description: 'Human-friendly and powerful HTTP request library for Node.js', htmlUrl: 'https://github.com/sindresorhus/got', stars: 13500, forks: 850, language: 'TypeScript', updatedAt: new Date() }
    ]
  },
  {
    githubId: 25254,
    username: 'tj',
    name: 'TJ Holowaychuk',
    bio: 'Apex Software. Building software and designing products.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/25254?v=4',
    htmlUrl: 'https://github.com/tj',
    company: 'Apex Software',
    location: 'Victoria, BC, Canada',
    blog: 'https://apex.sh',
    twitterUsername: 'tjholowaychuk',
    publicRepos: 590,
    publicGists: 380,
    followers: 52000,
    following: 0,
    githubCreatedAt: new Date('2008-09-18T18:04:12Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 11200,
    totalPullRequests: 1600,
    totalIssues: 920,
    totalReviews: 1400,
    totalContributions: 15120,
    contributionStreak: 35,
    longestStreak: 290,
    topLanguages: [
      { name: 'Go', percentage: 55.4, bytes: 18000000, color: '#00ADD8' },
      { name: 'JavaScript', percentage: 38.2, bytes: 12400000, color: '#f1e05a' },
      { name: 'C', percentage: 6.4, bytes: 2100000, color: '#555555' }
    ],
    repositories: [
      { name: 'commander.js', description: 'Node.js command-line interfaces made easy', htmlUrl: 'https://github.com/tj/commander.js', stars: 26500, forks: 1700, language: 'JavaScript', updatedAt: new Date() },
      { name: 'git-extras', description: 'GIT utilities -- repo summary, repl, changelog population, etc.', htmlUrl: 'https://github.com/tj/git-extras', stars: 17400, forks: 1300, language: 'Shell', updatedAt: new Date() }
    ]
  },
  {
    githubId: 13041,
    username: 'rauchg',
    name: 'Guillermo Rauch',
    bio: 'CEO @vercel. Making the Web faster.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/13041?v=4',
    htmlUrl: 'https://github.com/rauchg',
    company: 'Vercel',
    location: 'San Francisco, CA',
    blog: 'https://rauchg.com',
    twitterUsername: 'rauchg',
    publicRepos: 240,
    publicGists: 140,
    followers: 68500,
    following: 88,
    githubCreatedAt: new Date('2008-06-08T19:54:19Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 4300,
    totalPullRequests: 780,
    totalIssues: 410,
    totalReviews: 950,
    totalContributions: 6440,
    contributionStreak: 21,
    longestStreak: 195,
    topLanguages: [
      { name: 'TypeScript', percentage: 58.0, bytes: 11000000, color: '#3178c6' },
      { name: 'JavaScript', percentage: 36.0, bytes: 6800000, color: '#f1e05a' },
      { name: 'CSS', percentage: 6.0, bytes: 1140000, color: '#1572B6' }
    ],
    repositories: [
      { name: 'next.js', description: 'The React Framework', htmlUrl: 'https://github.com/vercel/next.js', stars: 128000, forks: 27000, language: 'JavaScript', updatedAt: new Date() },
      { name: 'slackin', description: 'Public Slack organization invite page', htmlUrl: 'https://github.com/rauchg/slackin', stars: 5900, forks: 650, language: 'JavaScript', updatedAt: new Date() }
    ]
  },
  {
    githubId: 124599,
    username: 'shadcn',
    name: 'shadcn',
    bio: 'Designing and building open source tools for developers.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/124599?v=4',
    htmlUrl: 'https://github.com/shadcn',
    company: null,
    location: 'San Francisco, CA',
    blog: 'https://ui.shadcn.com',
    twitterUsername: 'shadcn',
    publicRepos: 65,
    publicGists: 30,
    followers: 78000,
    following: 40,
    githubCreatedAt: new Date('2009-09-08T09:20:10Z'),
    githubUpdatedAt: new Date(),
    totalCommits: 3890,
    totalPullRequests: 1150,
    totalIssues: 540,
    totalReviews: 820,
    totalContributions: 6400,
    contributionStreak: 41,
    longestStreak: 160,
    topLanguages: [
      { name: 'TypeScript', percentage: 84.5, bytes: 15200000, color: '#3178c6' },
      { name: 'CSS', percentage: 11.0, bytes: 1980000, color: '#1572B6' },
      { name: 'JavaScript', percentage: 4.5, bytes: 810000, color: '#f1e05a' }
    ],
    repositories: [
      { name: 'ui', description: 'Beautifully designed components that you can copy and paste into your apps.', htmlUrl: 'https://github.com/shadcn-ui/ui', stars: 76000, forks: 6200, language: 'TypeScript', updatedAt: new Date() },
      { name: 'taxonomy', description: 'An open source application built using the new router, server components and everything new in Next.js 13.', htmlUrl: 'https://github.com/shadcn-ui/taxonomy', stars: 18000, forks: 2100, language: 'TypeScript', updatedAt: new Date() }
    ]
  }
];

// Helper to generate simulated 30-day contribution timeline
function generateContributionCalendar(totalContributions) {
  const calendar = [];
  const today = new Date();
  const dailyAverage = Math.max(1, Math.floor(totalContributions / 365));

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);

