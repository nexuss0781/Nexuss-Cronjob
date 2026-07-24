interface DB {
  users: Record<string, { id: string; email: string; name: string; passwordHash: string; createdAt: string }>;
  monitors: Record<string, { id: string; userId: string; name: string; url: string; method: string; headers?: Record<string, string>; body?: string; interval: number; status: string; lastCheck?: string; lastResponseTime?: number; lastStatusCode?: number; uptime: number; totalChecks: number; failedChecks: number; createdAt: string }>;
  checks: Record<string, { id: string; monitorId: string; status: string; statusCode?: number; responseTime?: number; error?: string; timestamp: string }>;
}

let db: DB = {
  users: {},
  monitors: {},
  checks: {},
};

export function getUserByEmail(email: string) {
  return Object.values(db.users).find(u => u.email === email) || null;
}

export function getUserById(id: string) {
  return db.users[id] || null;
}

export function createUser(user: { id: string; email: string; name: string; passwordHash: string }) {
  db.users[user.id] = { ...user, createdAt: new Date().toISOString() };
}

export function getMonitorsByUser(userId: string) {
  return Object.values(db.monitors)
    .filter(m => m.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMonitorById(id: string) {
  return db.monitors[id] || null;
}

export function saveMonitor(monitor: DB['monitors'][string]) {
  if (!db.monitors[monitor.id]) {
    monitor.createdAt = monitor.createdAt || new Date().toISOString();
  }
  db.monitors[monitor.id] = { ...monitor };
}

export function deleteMonitor(id: string) {
  delete db.monitors[id];
  Object.keys(db.checks).forEach(k => {
    if (db.checks[k].monitorId === id) delete db.checks[k];
  });
}

export function addCheckResult(check: DB['checks'][string]) {
  db.checks[check.id] = { ...check };
}

export function getCheckResults(monitorId: string, limit = 50) {
  return Object.values(db.checks)
    .filter(c => c.monitorId === monitorId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getAllMonitors() {
  return Object.values(db.monitors);
}

export type Monitor = DB['monitors'][string];
export type CheckResult = DB['checks'][string];
