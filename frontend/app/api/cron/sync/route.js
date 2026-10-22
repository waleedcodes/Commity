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

async function handleSync(request) {
  // Validate authorization if CRON_SECRET is configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    logger.info('🚀 Triggering on-demand weekly sync via API...');
    
    // Run weekly sync cycle
    const result = await syncWorker.runWeeklySync();
    
    return NextResponse.json({
      success: true,
      message: 'Weekly snapshot sync completed successfully',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    logger.error('Error executing sync endpoint:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
