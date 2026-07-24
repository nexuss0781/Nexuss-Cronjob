import { authenticate, handleError, jsonError } from '../_lib/auth.js';
import { getMonitorById, saveMonitor, deleteMonitor } from '../_lib/store.js';

export async function GET(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return jsonError('Missing monitor id', 400);
    const monitor = await getMonitorById(id);
    if (!monitor) return jsonError('Monitor not found', 404);
    if (monitor.userId !== auth.userId) return jsonError('Forbidden', 403);

    return Response.json({ monitor });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return jsonError('Missing monitor id', 400);
    const monitor = await getMonitorById(id);
    if (!monitor) return jsonError('Monitor not found', 404);
    if (monitor.userId !== auth.userId) return jsonError('Forbidden', 403);

    const body = await request.json();
    const { name, url: newUrl, method, interval, headers, body: reqBody } = body;

    if (name !== undefined) monitor.name = name;
    if (newUrl !== undefined) monitor.url = newUrl;
    if (method !== undefined) monitor.method = method;
    if (interval !== undefined) monitor.interval = interval;
    if (headers !== undefined) monitor.headers = headers;
    if (reqBody !== undefined) monitor.body = reqBody;

    await saveMonitor(monitor);
    return Response.json({ monitor });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return jsonError('Missing monitor id', 400);
    const monitor = await getMonitorById(id);
    if (!monitor) return jsonError('Monitor not found', 404);
    if (monitor.userId !== auth.userId) return jsonError('Forbidden', 403);

        await deleteMonitor(id);
    return Response.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
