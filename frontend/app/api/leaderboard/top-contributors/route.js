import { handleRequest } from '@/server/adapter';
const LeaderboardController = require('@/server/controllers/leaderboardController');

export async function GET(request, context) {
  return handleRequest(LeaderboardController.getTopContributors, request, context);
}
