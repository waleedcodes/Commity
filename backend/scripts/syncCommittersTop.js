const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const CommittersService = require('../src/services/committersService');
const logger = require('../src/utils/logger');

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in backend/.env');
    }

    logger.info('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB.');

    // 1. Sync Pakistan (All 256 top developers)
    logger.info('=== INGESTING PAKISTAN TOP 256 DEVELOPERS ===');
    const pkResult = await CommittersService.syncRegion('pakistan', 'Pakistan');
    console.log('Pakistan Sync Result:', pkResult);

    // 2. Check waleedcodes rank and top 5 developers
    const User = require('../src/models/User');
    const topPk = await User.find({ location: { $regex: 'pakistan', $options: 'i' } })
      .sort({ totalContributions: -1 })
      .limit(5)
      .select('username name totalContributions countryRank');
    console.log('Top 5 in Pakistan after sync:');
    topPk.forEach((u, i) => console.log(`  #${i + 1}: @${u.username} (${u.name}) - ${u.totalContributions.toLocaleString()} contribs`));

    const waleed = await User.findOne({ username: 'waleedcodes' });
    if (waleed) {
      console.log(`\n@waleedcodes Status:`);
      console.log(`  Name: ${waleed.name}`);
      console.log(`  Contributions: ${waleed.totalContributions.toLocaleString()}`);
      console.log(`  Country Rank: #${waleed.countryRank || 'N/A'}`);
    }

    const totalPkCount = await User.countDocuments({ location: { $regex: 'pakistan', $options: 'i' } });
    const totalAllCount = await User.countDocuments();
    console.log(`\nTotal Users in DB: ${totalAllCount}`);
    console.log(`Total Pakistan Developers in DB: ${totalPkCount}`);

    process.exit(0);
  } catch (error) {
    logger.error('Error running syncCommittersTop:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
