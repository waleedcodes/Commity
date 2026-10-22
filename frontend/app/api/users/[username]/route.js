import { handleRequest } from '@/server/adapter';
const UserController = require('@/server/controllers/userController');

export async function GET(request, context) {
  return handleRequest(UserController.getUserProfile, request, context);
}

export async function PUT(request, context) {
  return handleRequest(UserController.updateUserProfile, request, context);
}
