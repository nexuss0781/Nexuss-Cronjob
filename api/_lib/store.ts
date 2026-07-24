import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 5 });

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      headers JSONB,
      body TEXT,
      interval INTEGER NOT NULL DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'pending',
      "lastCheck" TEXT,
      "lastResponseTime" INTEGER,
      "lastStatusCode" INTEGER,
      uptime REAL NOT NULL DEFAULT 0,
      "totalChecks" INTEGER NOT NULL DEFAULT 0,
      "failedChecks" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY,
      "monitorId" TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      "statusCode" INTEGER,
      "responseTime" INTEGER,
      error TEXT,
      "timestamp" TEXT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_monitors_user ON monitors("userId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_checks_monitor ON checks("monitorId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_checks_time ON checks("timestamp" DESC)`;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM users`;
  if (count === 0) {
    const bcryptHash = '$2b$10$jdq4hgAc8sJVfqLw6e1veeC1kL8Cp/IzzAkK/NOms9ziu.6m68EIO';
    await sql`
      INSERT INTO users (id, email, name, "passwordHash", "createdAt")
      VALUES ('00000000-0000-0000-0000-000000000001', 'admin@nexuss.dev', 'Admin', ${bcryptHash}, ${new Date().toISOString()})
    `;
  }
}

let _initialized = false;
async function init() {
  if (_initialized) return;
  await ensureTables();
  _initialized = true;
}

export async function getUserByEmail(email: string) {
  await init();
  const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
  return user || null;
}

export async function getUserById(id: string) {
  await init();
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  return user || null;
}

export async function createUser(user: { id: string; email: string; name: string; passwordHash: string; createdAt: string }) {
  await init();
  await sql`
    INSERT INTO users (id, email, name, "passwordHash", "createdAt")
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.passwordHash}, ${user.createdAt})
  `;
}

function parseMonitor(m: any) {
  if (!m) return m;
  if (typeof m.headers === 'string') {
    try { m.headers = JSON.parse(m.headers); } catch {}
  }
  return m;
}

export async function getMonitorsByUser(userId: string) {
  await init();
  const rows = await sql`
    SELECT * FROM monitors WHERE "userId" = ${userId} ORDER BY "createdAt" DESC
  `;
  return rows.map(parseMonitor);
}

export async function getMonitorById(id: string) {
  await init();
  const [monitor] = await sql`SELECT * FROM monitors WHERE id = ${id}`;
  return parseMonitor(monitor) || null;
}

export async function saveMonitor(monitor: any) {
  await init();
  await sql`
    INSERT INTO monitors (id, "userId", name, url, method, headers, body, interval, status, "lastCheck", "lastResponseTime", "lastStatusCode", uptime, "totalChecks", "failedChecks", "createdAt")
    VALUES (${monitor.id}, ${monitor.userId}, ${monitor.name}, ${monitor.url}, ${monitor.method}, ${monitor.headers ? JSON.stringify(monitor.headers) : null}::jsonb, ${monitor.body || null}, ${monitor.interval}, ${monitor.status}, ${monitor.lastCheck || null}, ${monitor.lastResponseTime || null}, ${monitor.lastStatusCode || null}, ${monitor.uptime || 0}, ${monitor.totalChecks || 0}, ${monitor.failedChecks || 0}, ${monitor.createdAt || new Date().toISOString()})
    ON CONFLICT (id) DO UPDATE SET
      name = ${monitor.name}, url = ${monitor.url}, method = ${monitor.method},
      headers = ${monitor.headers ? JSON.stringify(monitor.headers) : null}::jsonb,
      body = ${monitor.body || null}, interval = ${monitor.interval}, status = ${monitor.status},
      "lastCheck" = ${monitor.lastCheck || null}, "lastResponseTime" = ${monitor.lastResponseTime || null},
      "lastStatusCode" = ${monitor.lastStatusCode || null}, uptime = ${monitor.uptime || 0},
      "totalChecks" = ${monitor.totalChecks || 0}, "failedChecks" = ${monitor.failedChecks || 0}
  `;
}

export async function deleteMonitor(id: string) {
  await init();
  await sql`DELETE FROM checks WHERE "monitorId" = ${id}`;
  await sql`DELETE FROM monitors WHERE id = ${id}`;
}

export async function addCheckResult(check: any) {
  await init();
  await sql`
    INSERT INTO checks (id, "monitorId", status, "statusCode", "responseTime", error, "timestamp")
    VALUES (${check.id}, ${check.monitorId}, ${check.status}, ${check.statusCode || null}, ${check.responseTime || null}, ${check.error || null}, ${check.timestamp})
  `;
}

export async function getCheckResults(monitorId: string, limit = 50) {
  await init();
  return await sql`
    SELECT * FROM checks WHERE "monitorId" = ${monitorId}
    ORDER BY "timestamp" DESC LIMIT ${limit}
  `;
}

export async function getAllMonitors() {
  await init();
  const rows = await sql`SELECT * FROM monitors`;
  return rows.map(parseMonitor);
}

export type Monitor = {
  id: string; userId: string; name: string; url: string; method: string;
  headers?: Record<string, string>; body?: string; interval: number; status: string;
  lastCheck?: string; lastResponseTime?: number; lastStatusCode?: number;
  uptime: number; totalChecks: number; failedChecks: number; createdAt: string;
};

export type CheckResult = {
  id: string; monitorId: string; status: string; statusCode?: number;
  responseTime?: number; error?: string; timestamp: string;
};
