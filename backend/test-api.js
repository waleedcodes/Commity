require('dotenv').config();
const app = require('./src/index');
const request = require('supertest');

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await request(app)
      .get('/health')
      .expect(200);
    console.log('   ✅ Health check passed');
    
    console.log('\n2. Testing user profile endpoint...');
    const userResponse = await request(app)
      .get('/api/users/waleedcodes')
      .expect(200);
    
    const userData = userResponse.body.data.profile;
    console.log('   ✅ User profile endpoint works');
    console.log('   User data received:', {
      username: userData.username,
      name: userData.name,
      totalCommits: userData.totalCommits,
      totalPullRequests: userData.totalPullRequests,
      languagesCount: userData.topLanguages?.length || 0,
      followersCount: userData.followers
    });
    
    console.log('\n3. Testing user analytics endpoint...');
    const analyticsResponse = await request(app)
      .get('/api/analytics/user/waleedcodes')
      .expect(200);
    
    const analyticsData = analyticsResponse.body.data;
    console.log('   ✅ User analytics endpoint works');
    console.log('   Analytics data received:', {
      username: analyticsData.user.username,
      lifetimeCommits: analyticsData.statistics?.lifetime?.commits,
      languagesCount: analyticsData.languageAnalysis?.totalLanguages
    });
    
    console.log('\n✅ All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.text);
    }
  } finally {
    process.exit(0);
  }
}

testAPI();
