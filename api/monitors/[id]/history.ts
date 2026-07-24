import { authenticate, handleError, jsonError } from '../../_lib/auth.js';
import { getMonitorById, getCheckResults } from '../../_lib/store.js';

export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    if (!id) return jsonError('Missing monitor id', 400);

    const monitor = await getMonitorById(id);
    if (!monitor) return jsonError('Monitor not found', 404);
    if (monitor.userId !== auth.userId) return jsonError('Forbidden', 403);

    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const results = await getCheckResults(id, limit);
    return Response.json({ results });
  } catch (err) {
    return handleError(err);
  }
}
