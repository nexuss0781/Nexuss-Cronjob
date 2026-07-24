import { handleError, jsonError } from '../_lib/auth.js';
import {
  getAllMonitors,
  saveMonitor,
  addCheckResult,
} from '../_lib/store.js';
import type { CheckResult } from '../_lib/store.js';

export const maxDuration = 30;

export async function GET() {
  try {
    const monitors = await getAllMonitors();
    let checked = 0;

    for (const monitor of monitors) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const start = Date.now();

      try {
        const init: RequestInit = {
          method: monitor.method,
          signal: controller.signal,
          headers: { 'User-Agent': 'Nexuss-Monitor/1.0' },
        };

        if (monitor.headers) {
          init.headers = { ...init.headers, ...monitor.headers };
        }
        if (monitor.body && ['POST', 'PUT', 'PATCH'].includes(monitor.method)) {
          init.body = monitor.body;
          if (!(init.headers as Record<string, string>)['Content-Type']) {
            (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
          }
        }

        const response = await fetch(monitor.url, init);
        clearTimeout(timeout);
        const responseTime = Date.now() - start;

        const isUp = response.status >= 200 && response.status < 400;

        monitor.status = isUp ? 'up' : 'down';
        monitor.lastCheck = new Date().toISOString();
        monitor.lastResponseTime = responseTime;
        monitor.lastStatusCode = response.status;
        monitor.totalChecks = (monitor.totalChecks || 0) + 1;
        if (!isUp) monitor.failedChecks = (monitor.failedChecks || 0) + 1;
        monitor.uptime = Math.round(
          (((monitor.totalChecks || 0) - (monitor.failedChecks || 0)) / (monitor.totalChecks || 1)) * 100
        );

        const result: CheckResult = {
          id: crypto.randomUUID(),
          monitorId: monitor.id,
          status: isUp ? 'up' : 'down',
          statusCode: response.status,
          responseTime,
          timestamp: new Date().toISOString(),
        };

        await addCheckResult(result);
      } catch (err) {
        clearTimeout(timeout);
        const responseTime = Date.now() - start;

        monitor.status = 'down';
        monitor.lastCheck = new Date().toISOString();
        monitor.lastResponseTime = responseTime;
        monitor.lastStatusCode = 0;
        monitor.totalChecks = (monitor.totalChecks || 0) + 1;
        monitor.failedChecks = (monitor.failedChecks || 0) + 1;
        monitor.uptime = Math.round(
          (((monitor.totalChecks || 0) - (monitor.failedChecks || 0)) / (monitor.totalChecks || 1)) * 100
        );

        const result: CheckResult = {
          id: crypto.randomUUID(),
          monitorId: monitor.id,
          status: 'down',
          statusCode: 0,
          responseTime,
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };

        await addCheckResult(result);
      }

      await saveMonitor(monitor);
      checked += 1;
    }

    return Response.json({ checked, timestamp: new Date().toISOString() });
  } catch (err) {
    return handleError(err);
  }
}
