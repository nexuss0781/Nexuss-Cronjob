import { getUserById } from '../_lib/store.js';
import { authenticate, jsonError } from '../_lib/auth.js';

export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return jsonError('Unauthorized', 401);
    }

    const user = await getUserById(auth.userId);
    if (!user) {
      return jsonError('User not found', 404);
    }

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('not configured')) {
      return jsonError('Database initialization failed.', 503);
    }
    return jsonError(msg || 'Internal server error', 500);
  }
}
