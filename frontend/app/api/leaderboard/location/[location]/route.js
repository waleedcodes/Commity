// [Commity Phase 2 Logic] route.js
import { handleRequest } from '@/server/adapter';
const LeaderboardController = require('@/server/controllers/leaderboardController');

export async function GET(request, context) {
  return handleRequest(LeaderboardController.getLeaderboardByLocation, request, context);
}
