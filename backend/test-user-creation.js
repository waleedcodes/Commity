require('dotenv').config();
const connectDB = require('./src/config/database');
const GitHubService = require('./src/services/githubService');
const UserService = require('./src/services/userService');

async function testUserCreation() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');
    
    const githubService = new GitHubService();
    const userService = new UserService();
    const username = 'waleedcodes';
    
    console.log(`\nFetching complete data for ${username}...`);
    
    // Fetch all data
    console.log('1. Fetching basic profile...');
    const profile = await githubService.getUserProfile(username);
    console.log('   ✅ Profile fetched:', profile.username, profile.name);
    
    console.log('2. Fetching contributions...');
    const contributions = await githubService.getUserContributions(username);
    console.log('   ✅ Contributions fetched:', {
      totalCommits: contributions.totalCommits,
      totalPullRequests: contributions.totalPullRequests,
      totalIssues: contributions.totalIssues,
      calendarDays: contributions.contributionCalendar.length
    });
    
    console.log('3. Fetching languages...');
    const languages = await githubService.getUserLanguages(username);
    console.log('   ✅ Languages fetched:', languages.slice(0, 3).map(l => `${l.name} (${l.percentage}%)`));
    
    // Merge data
    const completeUserData = {
      ...profile,
      totalCommits: contributions.totalCommits || 0,
      totalPullRequests: contributions.totalPullRequests || 0,
      totalIssues: contributions.totalIssues || 0,
      totalReviews: contributions.totalReviews || 0,
      contributionStreak: contributions.contributionStreak || 0,
      longestStreak: contributions.longestStreak || 0,
      contributionCalendar: contributions.contributionCalendar || [],
      topLanguages: languages.slice(0, 10).map(lang => ({
        name: lang.name,
        percentage: lang.percentage,
        bytes: lang.bytes,
        color: lang.color || '#f1c40f'
      }))
    };
    
    console.log('\n4. Creating/updating user in database...');
    const user = await userService.createOrUpdateUser(completeUserData);
    
    console.log('✅ User created/updated successfully!');
    console.log('Final user data:', {
      username: user.username,
      name: user.name,
      totalCommits: user.totalCommits,
      totalPullRequests: user.totalPullRequests,
      languagesCount: user.topLanguages?.length || 0,
      calendarCount: user.contributionCalendar?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testUserCreation();
