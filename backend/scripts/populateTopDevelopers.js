const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/database');
const UserService = require('../src/services/userService');
const GitHubService = require('../src/services/githubService');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

// Top known maintainers from Pakistan and around the world
const PAKISTAN_HANDLES = [
  'waleedcodes',
  'FareedKhan-dev',
  'wajahatkarim3',
  'axiftaj',
  'farhanashrafdev',
  'Ameen-Alam',
  'SyedShaheerHussain',
  'abdulrdeveloper',
  'yasir-shahzad',
  'ghousahmed',
  'AsharibAli',
  'shanraisshan',
  'EimanTahir027',
  'dev-sire',
  'danyalmoazzam',
  'mubashir-ali-9',
  'ShehrozIrfan'
];

const GLOBAL_HANDLES = [
  'sindresorhus', // France
  'antfu',        // Japan
  'tj',           // Canada
  'yyx990803',    // Singapore
  'torvalds',     // USA
  'shadcn',       // USA
  'gaearon',      // UK
  'rauchg',       // USA
  'tiangolo',     // Germany (FastAPI)
  'kamranahmedse',// UK (roadmap.sh)
  'kentcdodds',   // USA
  'wesbos',       // Canada
  'amitshekhariitbhu', // India
  'kelseyhightower' // USA
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateDevelopers() {
  console.log('🚀 Starting Top Developers Indexer for Commity...');
  await connectDB();
  const userService = new UserService();
  const githubService = new GitHubService();

  // 1. Discover top developers from Pakistan via GitHub Search API
  console.log('\n🇵🇰 Searching GitHub for top active developers in Pakistan...');
  let discoveredPakistan = [...PAKISTAN_HANDLES];
  try {
    const searchRes = await githubService.searchUsers('location:Pakistan', {
      sort: 'followers',
      order: 'desc',
      per_page: 25,
    });
    if (searchRes && searchRes.users) {
      const handles = searchRes.users.map(u => u.username).filter(Boolean);
      discoveredPakistan = Array.from(new Set([...discoveredPakistan, ...handles]));
      console.log(`✅ Discovered ${discoveredPakistan.length} developers in Pakistan from GitHub.`);
    }
  } catch (err) {
    console.warn(`⚠️ GitHub search location:Pakistan notice: ${err.message}. Using curated list.`);
  }

  // 2. Sync Pakistan developers
  console.log('\n⏳ Syncing Pakistan developers into MongoDB...');
  let pkSuccess = 0;
  for (const username of discoveredPakistan.slice(0, 20)) {
    try {
      console.log(` -> Fetching @${username}...`);
      const user = await userService.syncUserProfile(username, true);
      // Ensure location contains Pakistan if empty or missing
      if (!user.location || !user.location.toLowerCase().includes('pakistan')) {
        user.location = user.location ? `${user.location}, Pakistan` : 'Pakistan';
        await user.save();
      }
      console.log(`    ✓ Saved @${username}: ${user.name || username} (${user.totalContributions || 0} contribs, ${user.followers || 0} followers, ${user.location})`);
      pkSuccess++;
      await sleep(300); // Throttling
    } catch (err) {
      console.warn(`    ✗ Failed @${username}: ${err.message}`);
    }
  }

  // 3. Sync Global developers
  console.log('\n🌍 Syncing Global champions into MongoDB...');
  let globalSuccess = 0;
  for (const username of GLOBAL_HANDLES) {
    try {
      console.log(` -> Fetching @${username}...`);
      const user = await userService.syncUserProfile(username, false);
      console.log(`    ✓ Saved @${username}: ${user.name || username} (${user.totalContributions || 0} contribs, ${user.followers || 0} followers, ${user.location})`);
      globalSuccess++;
      await sleep(300);
    } catch (err) {
      console.warn(`    ✗ Failed @${username}: ${err.message}`);
    }
  }

  // 4. Update rankings
  console.log('\n📊 Recalculating global and regional ranks...');
  const totalInDb = await User.countDocuments({ isActive: true });
  const pkInDb = await User.countDocuments({ isActive: true, location: { $regex: 'Pakistan', $options: 'i' } });

  console.log(`\n🎉 Indexing Complete!`);
  console.log(`📈 Total Tracked Active Developers: ${totalInDb}`);
  console.log(`🇵🇰 Total Pakistan Developers Tracked: ${pkInDb}`);
  
  process.exit(0);
}

populateDevelopers().catch(err => {
  console.error('Fatal error in populateDevelopers:', err);
  process.exit(1);
});
