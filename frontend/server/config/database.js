const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/github-analytics';

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
