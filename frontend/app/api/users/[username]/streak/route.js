// [Commity Phase 2 Logic] route.js
import { handleRequest } from '@/server/adapter';
const UserController = require('@/server/controllers/userController');

export async function GET(request, context) {
  return handleRequest(UserController.getUserStreak, request, context);
}
