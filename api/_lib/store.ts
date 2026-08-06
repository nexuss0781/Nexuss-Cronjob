import { connect } from 'parad';

async function connectWithRetry() {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await connect({
        name: process.env.PARADOX_DB || 'nexuss-cronjob',
        project: process.env.PARADOX_PROJECT || 'nexuss',
        gatewayUrl: process.env.PARADOX_GATEWAY || 'https://paradox-db.onrender.com/v1',
        apiKey: process.env.PARADOX_TOKEN,
        passphrase: process.env.PARADOX_PASSPHRASE,
        pullOnStartup: true,
      });
    } catch (err) {
      lastErr = err;
      console.error(`parad connect attempt ${attempt}/6 failed: ${err instanceof Error ? err.message : err}`);
      await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 30000)));
    }
  }
  throw lastErr;
}

const db = await connectWithRetry();

async function ensureTables() {
  db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      headers TEXT,
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
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY,
      "monitorId" TEXT NOT NULL,
      status TEXT NOT NULL,
      "statusCode" INTEGER,
      "responseTime" INTEGER,
      error TEXT,
      "timestamp" TEXT NOT NULL
    )
  `);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_checks_monitor ON checks("monitorId")`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_checks_time ON checks("timestamp" DESC)`);

  const { rows } = db.execute('SELECT COUNT(*) AS n FROM users');
  if ((rows[0] as { n: number }).n === 0) {
    const bcryptHash = '$2b$10$jdq4hgAc8sJVfqLw6e1veeC1kL8Cp/IzzAkK/NOms9ziu.6m68EIO';
    db.execute(
      `INSERT INTO users (id, email, name, "passwordHash", "createdAt")
       VALUES (?, ?, ?, ?, ?)`,
      [
        '00000000-0000-0000-0000-000000000001',
        'admin@nexuss.dev',
        'Admin',
        bcryptHash,
        new Date().toISOString(),
      ]
    );
  }
}

let _initialized = false;
async function init() {
  if (_initialized) return;
  await ensureTables();
  _initialized = true;
}

function toRow(monitor: any) {
  const row = { ...monitor };
  if (row.headers && typeof row.headers !== 'string') {
    row.headers = JSON.stringify(row.headers);
  }
  return row;
}

export async function getUserByEmail(email: string) {
  await init();
  return db.engine.get('users', { email }) || null;
}

export async function getUserById(id: string) {
  await init();
  return db.engine.get('users', { id }) || null;
}

export async function createUser(user: { id: string; email: string; name: string; passwordHash: string; createdAt: string }) {
  await init();
  db.engine.insert('users', user);
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
  const { rows } = db.execute('SELECT * FROM monitors WHERE "userId" = ? ORDER BY "createdAt" DESC', [userId]);
  return rows.map(parseMonitor);
}

export async function getMonitorById(id: string) {
  await init();
  return parseMonitor(db.engine.get('monitors', { id }));
}

export async function saveMonitor(monitor: any) {
  await init();
  const row = toRow(monitor);
  if (!row.createdAt) row.createdAt = new Date().toISOString();
  db.engine.upsert('monitors', row, 'id');
}

export async function deleteMonitor(id: string) {
  await init();
  db.engine.delete('checks', { monitorId: id });
  db.engine.delete('monitors', { id });
}

export async function addCheckResult(check: any) {
  await init();
  db.engine.insert('checks', check);
}

export async function getCheckResults(monitorId: string, limit = 50) {
  await init();
  const { rows } = db.execute(
    'SELECT * FROM checks WHERE "monitorId" = ? ORDER BY "timestamp" DESC LIMIT ?',
    [monitorId, limit]
  );
  return rows;
}

export async function getAllMonitors() {
  await init();
  const { rows } = db.execute('SELECT * FROM monitors ORDER BY "createdAt" DESC');
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

async function shutdown() {
  try { await db.close(); } catch {}
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
