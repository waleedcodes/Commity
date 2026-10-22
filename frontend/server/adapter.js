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
    }
  }

  let statusCode = 200;
  const headers = new Headers();

  const req = {
    method: request.method,
    url: request.url,
    originalUrl: url.pathname + url.search,
    path: url.pathname,
    query,
    params,
    body,
    headers: Object.fromEntries(request.headers.entries()),
    ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
    get(headerName) {
      return request.headers.get(headerName);
    },
  };

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(name, value) {
      headers.set(name, value);
      return res;
    },
    header(name, value) {
      headers.set(name, value);
      return res;
    },
  };

  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (response) => {
      if (!resolved) {
        resolved = true;
        resolve(response);
      }
    };

