import { NextResponse } from 'next/server';
const connectDB = require('./config/database');
const logger = require('./utils/logger');

/**
 * Adapter that executes Express-style controller functions within Next.js App Router
 * @param {Function} handler - Express controller function (req, res, next)
 * @param {Request} request - Next.js Request object
 * @param {Object} context - Route context containing params
 */
export async function handleRequest(handler, request, context = {}) {
  try {
    await connectDB();
  } catch (dbError) {
    logger.error('Database connection failed in route handler:', dbError.message);
    return NextResponse.json(
      { success: false, error: { message: 'Database connection failed', details: dbError.message } },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  
  // In Next.js 15, context.params may be a Promise
  let params = {};
  if (context && context.params) {
    params = typeof context.params.then === 'function' ? await context.params : context.params;
  }

  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else {
        const text = await request.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
    } catch {
      body = {};
