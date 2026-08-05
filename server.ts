import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

import * as registerRoute from './api/auth/register.ts';
import * as loginRoute from './api/auth/login.ts';
import * as meRoute from './api/auth/me.ts';
import * as monitorsRoute from './api/monitors/index.ts';
import * as monitorByIdRoute from './api/monitors/[id].ts';
import * as monitorHistoryRoute from './api/monitors/[id]/history.ts';
import * as checkRoute from './api/monitors/check.ts';

const PORT = Number(process.env.PORT || 3000);
const DIST_DIR = join(process.cwd(), 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

type Handler = (request: Request) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [
  { method: 'GET', pattern: /^\/api\/monitors\/check\/?$/, handler: (r) => checkRoute.GET(r) },
  { method: 'GET', pattern: /^\/api\/monitors\/([^/]+)\/history\/?$/, handler: (r) => monitorHistoryRoute.GET(r) },
  { method: 'GET', pattern: /^\/api\/monitors\/?$/, handler: (r) => monitorsRoute.GET(r) },
  { method: 'POST', pattern: /^\/api\/monitors\/?$/, handler: (r) => monitorsRoute.POST(r) },
  { method: 'GET', pattern: /^\/api\/monitors\/([^/]+)\/?$/, handler: (r) => monitorByIdRoute.GET(r) },
  { method: 'PUT', pattern: /^\/api\/monitors\/([^/]+)\/?$/, handler: (r) => monitorByIdRoute.PUT(r) },
  { method: 'DELETE', pattern: /^\/api\/monitors\/([^/]+)\/?$/, handler: (r) => monitorByIdRoute.DELETE(r) },
  { method: 'POST', pattern: /^\/api\/auth\/register\/?$/, handler: (r) => registerRoute.POST(r) },
  { method: 'POST', pattern: /^\/api\/auth\/login\/?$/, handler: (r) => loginRoute.POST(r) },
  { method: 'GET', pattern: /^\/api\/auth\/me\/?$/, handler: (r) => meRoute.GET(r) },
];

function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve(undefined);
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
  });
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const body = await readBody(req);
  const init: RequestInit & { duplex?: string } = { method: req.method || 'GET', headers };
  if (body && body.length > 0) {
    init.body = new Uint8Array(body) as unknown as BodyInit;
    init.duplex = 'half';
  }
  return new Request(url, init);
}

async function writeWebResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  for (const [key, value] of response.headers) {
    res.setHeader(key, value);
  }
  if (response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } else {
    res.end();
  }
}

async function serveStatic(res: ServerResponse, pathname: string): Promise<boolean> {
  if (pathname.startsWith('/api/')) return false;
  const clean = pathname === '/' ? '/index.html' : pathname.split('?')[0];
  const filePath = normalize(join(DIST_DIR, clean));
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return true;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
    return true;
  } catch {
    try {
      const index = await readFile(join(DIST_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(index);
      return true;
    } catch {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Build not found. Run `npm run build` first.');
      return true;
    }
  }
}

createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;

    if (pathname === '/health' || pathname === '/health/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'nexuss-cronjob' }));
      return;
    }

    if (pathname.startsWith('/api/')) {
      for (const route of routes) {
        if (req.method === route.method && route.pattern.test(pathname)) {
          const webRequest = await toWebRequest(req);
          const webResponse = await route.handler(webRequest);
          await writeWebResponse(res, webResponse);
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const served = await serveStatic(res, pathname);
    if (!served) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
  }
}).listen(PORT, () => {
  console.log(`nexuss-cronjob listening on ${PORT}`);
});
