export interface Monitor {
  id: string;
  userId: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  interval: number;
  status: 'up' | 'down' | 'pending';
  lastCheck?: string;
  lastResponseTime?: number;
  lastStatusCode?: number;
  uptime: number;
  totalChecks: number;
  failedChecks: number;
  createdAt: string;
}

export interface CheckResult {
  id: string;
  monitorId: string;
  status: 'up' | 'down';
  statusCode: number;
  responseTime: number;
  error?: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
