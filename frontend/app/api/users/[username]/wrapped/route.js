// [Commity Phase 2 Logic] route.js
import { handleRequest } from '@/server/adapter';
const WrappedController = require('@/server/controllers/wrappedController');

export async function GET(request, context) {
  return handleRequest(WrappedController.getDeveloperWrapped, request, context);
}
