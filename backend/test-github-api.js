require('dotenv').config();
const { createGitHubClient } = require('./src/config/github');

async function testGitHubAPI() {
  try {
    console.log('Testing GitHub API...');
    const octokit = createGitHubClient();
    
    // Test basic API access
    const { data: user } = await octokit.rest.users.getByUsername({
      username: 'waleedcodes'
    });
    
    console.log('✅ Basic API access works');
    console.log('User data:', {
      login: user.login,
      name: user.name,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following
    });
    
    // Test GraphQL API for contributions
    const contributionsQuery = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions
          }
        }
      }
    `;
    
    const contributionsResult = await octokit.graphql(contributionsQuery, {
      username: 'waleedcodes'
    });
    
    console.log('✅ GraphQL API access works');
    console.log('Contributions:', contributionsResult.user.contributionsCollection);
    
  } catch (error) {
    console.error('❌ GitHub API test failed:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
  }
}

testGitHubAPI();
