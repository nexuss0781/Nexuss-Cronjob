import { authenticate, handleError, jsonError } from '../_lib/auth.js';
import { getMonitorsByUser, saveMonitor, type Monitor } from '../_lib/store.js';

export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return jsonError('Unauthorized', 401);

    const monitors = await getMonitorsByUser(auth.userId);
    return Response.json({ monitors });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return jsonError('Unauthorized', 401);

    const { name, url, method, interval, headers, body } = await request.json();

    if (!name || !url || !method || !interval) {
      return jsonError('Name, url, method, and interval are required');
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(method)) {
      return jsonError('Invalid HTTP method');
    }
    if (typeof interval !== 'number' || interval < 10) {
      return jsonError('Interval must be at least 10 seconds');
    }

    const monitor: Monitor = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name,
      url,
      method,
      interval,
      headers: headers || undefined,
      body: body || undefined,
      status: 'pending',
      uptime: 0,
      totalChecks: 0,
      failedChecks: 0,
      createdAt: new Date().toISOString(),
    };

    await saveMonitor(monitor);
    return Response.json({ monitor }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
