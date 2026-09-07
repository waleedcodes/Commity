const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/User');
const RankingSnapshot = require('../src/models/RankingSnapshot');
const Analytics = require('../src/models/Analytics');

jest.setTimeout(15000);

const mockUser1 = {
  _id: '64f000000000000000000001',
  username: 'octocat',
  name: 'The Octocat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  location: 'Pakistan',
  followers: 12500,
  following: 9,
  publicRepos: 8,
  totalCommits: 1420,
  totalContributions: 1850,
  totalPullRequests: 45,
  totalIssues: 12,
  currentStreak: { count: 5, startDate: new Date(), endDate: new Date() },
  longestStreak: { count: 42, startDate: new Date(), endDate: new Date() },
  topLanguages: [{ name: 'JavaScript', percentage: 75 }, { name: 'Ruby', percentage: 25 }],
  rank: 1,
  countryRank: 1,
  globalRank: 1,
  categoryValue: 1850,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(true),
  toPublicJSON: function() {
    return {
      id: this._id,
      username: this.username,
      name: this.name,
      avatarUrl: this.avatarUrl,
      location: this.location,
      followers: this.followers,
      following: this.following,
      publicRepos: this.publicRepos,
      totalCommits: this.totalCommits,
      totalContributions: this.totalContributions,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      topLanguages: this.topLanguages,
      rank: this.rank,
      createdAt: this.createdAt
    };
  }
};

const mockUser2 = {
  _id: '64f000000000000000000002',
  username: 'torvalds',
  name: 'Linus Torvalds',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
  location: 'United States',
  followers: 195000,
  following: 0,
  publicRepos: 12,
  totalCommits: 9267,
  totalContributions: 9500,
  totalPullRequests: 10,
  totalIssues: 2,
  currentStreak: { count: 12, startDate: new Date(), endDate: new Date() },
  longestStreak: { count: 100, startDate: new Date(), endDate: new Date() },
  topLanguages: [{ name: 'C', percentage: 95 }, { name: 'Shell', percentage: 5 }],
  rank: 2,
  countryRank: 1,
  globalRank: 2,
  categoryValue: 9500,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(true),
  toPublicJSON: function() {
    return {
      id: this._id,
      username: this.username,
      name: this.name,
      avatarUrl: this.avatarUrl,
      location: this.location,
      followers: this.followers,
      following: this.following,
      publicRepos: this.publicRepos,
      totalCommits: this.totalCommits,
      totalContributions: this.totalContributions,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      topLanguages: this.topLanguages,
      rank: this.rank,
      createdAt: this.createdAt
    };
  }
};

const mockSnapshot = {
  region: 'Pakistan',
  regionKey: 'pakistan',
  generatedAt: new Date(),
  usersRanked: 256,
  totalUsersFound: 160760,
  minimumFollowers: 69,
  rankings: [
    { rank: 1, username: 'sufiyanshahiddev', name: 'Sufiyan Shahid', totalContributions: 140654, followers: 120 }
  ]
};

const mockAnalytics = {
  githubUsername: 'octocat',
  username: 'octocat',
  period: '30d',
  commits: 1420,
  pullRequests: 45,
  issues: 12,
  reviews: 5,
  totalContributions: 1482,
  languageBreakdown: [{ name: 'JavaScript', percentage: 75 }]
};

function createMockQuery(result) {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(result).catch(reject);
    }
  };
  return query;
}

beforeAll(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/github-analytics', {
        serverSelectionTimeoutMS: 2000,
      });
    }
  } catch (err) {
    // Graceful fallback when remote Atlas cluster is unreachable
  }

  // If MongoDB is not connected, configure resilient mock stubs
  if (mongoose.connection.readyState !== 1) {
    jest.spyOn(User, 'find').mockImplementation(() => createMockQuery([mockUser1, mockUser2]));
    jest.spyOn(User, 'findOne').mockImplementation(() => createMockQuery(mockUser1));
    jest.spyOn(User, 'countDocuments').mockResolvedValue(2);
    jest.spyOn(User, 'distinct').mockResolvedValue(['Pakistan', 'United States', 'Japan']);
    jest.spyOn(User, 'aggregate').mockResolvedValue([
      {
        _id: 'Pakistan',
        count: 2,
        totalContributions: 11350,
        totalCommits: 10687,
        totalPullRequests: 55,
        totalIssues: 14,
        totalRepos: 20,
        totalFollowers: 207500,
        avgCommitsPerUser: 5343,
        avgReposPerUser: 10,
        avgFollowersPerUser: 103750,
      }
    ]);
    jest.spyOn(RankingSnapshot, 'find').mockImplementation(() => createMockQuery([mockSnapshot]));
    jest.spyOn(RankingSnapshot, 'findOne').mockImplementation(() => createMockQuery(mockSnapshot));

    jest.spyOn(Analytics, 'find').mockImplementation(() => createMockQuery([mockAnalytics]));
    jest.spyOn(Analytics, 'findOne').mockImplementation(() => createMockQuery(mockAnalytics));
    jest.spyOn(Analytics, 'aggregate').mockResolvedValue([
      {
        _id: null,
        totalCommits: 1420,
        totalPullRequests: 45,
        totalIssues: 12,
        totalReviews: 5,
        avgCommits: 710
      }
    ]);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
});

describe('Health Check Endpoint', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });
});

describe('API Routes', () => {
  describe('Users API', () => {
    test('GET /api/users should return users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    test('GET /api/users/:username should return user profile', async () => {
      const response = await request(app)
        .get('/api/users/octocat')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('username', 'octocat');
    });

    test('GET /api/users with invalid query params should return 400', async () => {
      const response = await request(app)
        .get('/api/users?page=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('type', 'ValidationError');
    });

    test('GET /api/users/:username/streak should return streak metrics', async () => {
      const response = await request(app)
        .get('/api/users/octocat/streak')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('currentStreak');
      expect(response.body.data).toHaveProperty('longestStreak');
    });

    test('GET /api/users/:username/badge.svg should return SVG badge', async () => {
      const response = await request(app)
        .get('/api/users/octocat/badge.svg')
        .expect(200);

      expect(response.headers['content-type']).toContain('image/svg+xml');
      const content = response.text || (response.body && response.body.toString()) || '';
      expect(content).toContain('<svg');
    });
  });

  describe('Leaderboard API', () => {
    test('GET /api/leaderboard should return leaderboard data', async () => {
      const response = await request(app)
        .get('/api/leaderboard')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('category');
      expect(response.body.data).toHaveProperty('period');
    });

    test('GET /api/leaderboard?category=public_contributions should accept public_contributions category', async () => {
      const response = await request(app)
        .get('/api/leaderboard?category=public_contributions')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('category', 'public_contributions');
    });

    test('GET /api/leaderboard/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/leaderboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalContributions');
    });

    test('GET /api/leaderboard/featured should return algorithmic featured developers', async () => {
      const response = await request(app)
        .get('/api/leaderboard/featured')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('worldwide');
      expect(response.body.data).toHaveProperty('pakistan');
      expect(response.body.data).toHaveProperty('languages');
    });

    test('GET /api/leaderboard/regions should return dynamic regions list', async () => {
      const response = await request(app)
        .get('/api/leaderboard/regions')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
    });

    test('GET /api/leaderboard/snapshots should return regional snapshots', async () => {
      const response = await request(app)
        .get('/api/leaderboard/snapshots?region=pakistan')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Platform Stats API', () => {
    test('GET /api/platform/stats should return live dynamic platform stats', async () => {
      const response = await request(app)
        .get('/api/platform/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('indexedDevelopers');
      expect(response.body.data).toHaveProperty('totalContributions');
      expect(response.body.data).toHaveProperty('cadence', '7-Day Weekly Snapshots');
    });
  });

  describe('Analytics API', () => {
    test('GET /api/analytics should return analytics data', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('period');
    });

    test('GET /api/analytics/summary should return summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('POST /api/analytics/compare should return multi-user comparison', async () => {
      const response = await request(app)
        .post('/api/analytics/compare')
        .send({
          usernames: ['octocat', 'torvalds'],
          period: '30d'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  test('GET /non-existent-route should return 404', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
  });

  test('Invalid GitHub username should return 400', async () => {
    const response = await request(app)
      .get('/api/users/invalid@username')
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('type', 'ValidationError');
  });
});
