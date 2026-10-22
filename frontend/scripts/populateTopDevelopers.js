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
