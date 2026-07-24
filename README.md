<p align="center">
  <img src="public/favicon.svg" alt="Nexuss Logo" width="80" height="80" />
</p>

<h1 align="center">Nexuss Cronjob</h1>

<p align="center">
  Real-time uptime monitoring and alerting platform for APIs, websites, and services.
</p>

<p align="center">
  <a href="https://nexuss-cronjob.vercel.app">Live Demo</a>
</p>

---

## Overview

Nexuss Cronjob is a full-stack uptime monitoring application that continuously checks your endpoints and tracks their availability, response times, status codes, and uptime percentages. Built with React, TypeScript, and Vercel Serverless Functions.

## Features

- **Real-time Monitoring** — Continuous HTTP health checks with configurable intervals
- **Multi-method Support** — GET, POST, PUT, DELETE, PATCH requests
- **Custom Headers & Bodies** — Send authenticated or custom payloads to endpoints
- **Response Tracking** — Response time, status code, and error logging per check
- **Uptime Statistics** — Automatic uptime percentage calculation per monitor
- **Check History** — Expandable history panel showing recent check results
- **Quick Templates** — Pre-built templates for Health Checks, API Endpoints, Webhooks, and REST APIs
- **Custom Intervals** — Choose from presets (10s, 30s, 1m, 5m, 15m, 1h) or set any custom interval in seconds
- **JWT Authentication** — Secure user registration and login with bcrypt password hashing
- **Dashboard Overview** — Stats cards for total monitors, operational count, down count, and average response time
- **Dark UI** — Modern, responsive dark-themed interface

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Backend | Vercel Serverless Functions (Node.js) |
| Auth | JWT (jose), bcryptjs |
| Icons | Lucide React |
| Deployment | Vercel |

## Project Structure

```
Nexuss-Cronjob/
├── api/                        # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── auth.ts             # JWT utilities (sign, verify, error helpers)
│   │   └── store.ts            # In-memory data store (users, monitors, checks)
│   ├── auth/
│   │   ├── login.ts            # POST /api/auth/login
│   │   ├── register.ts         # POST /api/auth/register
│   │   └── me.ts               # GET  /api/auth/me
│   └── monitors/
│       ├── index.ts            # GET  /api/monitors (list) | POST (create)
│       ├── [id].ts             # GET  /api/monitors/:id | PUT (update) | DELETE
│       ├── [id]/history.ts     # GET  /api/monitors/:id/history
│       └── check.ts            # GET  /api/monitors/check (cron runner)
├── src/                        # React Frontend
│   ├── components/
│   │   ├── Layout.tsx          # App shell with header
│   │   ├── MonitorCard.tsx     # Monitor display + check history
│   │   ├── StatsCard.tsx       # Dashboard stat card
│   │   ├── StatusBadge.tsx     # Up/Down/Pending indicator
│   │   └── AddMonitorModal.tsx # Create monitor dialog
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main dashboard view
│   │   ├── Login.tsx           # Login page
│   │   └── Register.tsx        # Registration page
│   ├── hooks/
│   │   └── useAuth.tsx         # Auth context & provider
│   ├── lib/
│   │   └── api.ts              # API client with JWT injection
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── vercel.json                 # Vercel function config
├── package.json
└── vite.config.ts
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create a new account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/monitors` | List user's monitors | Yes |
| POST | `/api/monitors` | Create a new monitor | Yes |
| GET | `/api/monitors/:id` | Get monitor details | Yes |
| PUT | `/api/monitors/:id` | Update a monitor | Yes |
| DELETE | `/api/monitors/:id` | Delete a monitor | Yes |
| GET | `/api/monitors/:id/history` | Get check history | Yes |
| GET | `/api/monitors/check` | Trigger health checks | No |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/your-username/Nexuss-Cronjob.git
cd Nexuss-Cronjob
npm install
```

### Development

```bash
npm run dev
```

The app runs at `http://localhost:5173`. API requests are proxied to `http://localhost:3000` via Vite config.

### Build

```bash
npm run build
```

### Deploy

```bash
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Data Model

### Monitor

```typescript
interface Monitor {
  id: string;
  userId: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  interval: number;        // seconds
  status: 'up' | 'down' | 'pending';
  lastCheck?: string;      // ISO timestamp
  lastResponseTime?: number; // ms
  lastStatusCode?: number;
  uptime: number;          // percentage
  totalChecks: number;
  failedChecks: number;
  createdAt: string;
}
```

### CheckResult

```typescript
interface CheckResult {
  id: string;
  monitorId: string;
  status: 'up' | 'down';
  statusCode: number;
  responseTime: number;    // ms
  error?: string;
  timestamp: string;
}
```

## Interval Configuration

Choose from preset intervals or define a custom value:

| Preset | Value |
|--------|-------|
| 10s | 10 seconds |
| 30s | 30 seconds |
| 1m | 60 seconds |
| 5m | 300 seconds |
| 15m | 900 seconds |
| 1h | 3600 seconds |
| Custom | Any value in seconds |

## License

MIT
