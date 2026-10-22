import { handleRequest } from '@/server/adapter';
const UserController = require('@/server/controllers/userController');

export async function GET(request, context) {
  return handleRequest(UserController.getAllUsers, request, context);
}
