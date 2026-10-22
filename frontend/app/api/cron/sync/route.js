import { NextResponse } from 'next/server';
const connectDB = require('@/server/config/database');
const logger = require('@/server/utils/logger');
const syncWorker = require('@/server/services/syncWorker');

export const maxDuration = 60; // Allow maximum serverless execution time for sync

export async function GET(request) {
  return handleSync(request);
}

export async function POST(request) {
  return handleSync(request);
}

