import { handleRequest } from '@/server/adapter';
const AnalyticsController = require('@/server/controllers/analyticsController');

export async function GET(request, context) {
  return handleRequest(AnalyticsController.getUserAnalytics, request, context);
}
