const request = require('supertest');
const app = require('../src/index');

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

    test('GET /api/leaderboard/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/leaderboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalContributions');
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

// Test cleanup
afterAll(async () => {
  // Close any open connections
  if (app.close) {
    await app.close();
  }
});
