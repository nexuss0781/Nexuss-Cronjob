import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Monitor, CheckResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowLeft,
  Clock,
  Globe,
  Timer,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [monRes, histRes] = await Promise.all([
        api.monitors.get(id),
        api.monitors.history(id, 100),
      ]);
      setMonitor(monRes.monitor);
      setHistory(histRes.results);
    } catch {
      navigate('/');
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDelete = async () => {
    if (!id || !confirm('Delete this monitor?')) return;
    try {
      await api.monitors.delete(id);
      navigate('/');
    } catch {}
  };

  const uptimePercent =
    monitor && monitor.totalChecks > 0
      ? Math.round(
          ((monitor.totalChecks - monitor.failedChecks) / monitor.totalChecks) * 100
        )
      : 0;

  const chartData = [...history]
    .reverse()
    .map((c) => ({
      time: new Date(c.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      responseTime: c.responseTime || 0,
      status: c.status === 'up' ? 1 : 0,
      statusCode: c.statusCode || 0,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!monitor) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{monitor.name}</h1>
            <StatusBadge status={monitor.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
            <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-zinc-400 text-xs">
              {monitor.method}
            </span>
            <Globe className="w-3.5 h-3.5" />
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              {monitor.url}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="text-xs text-zinc-500 mb-1">Uptime</div>
          <div className="text-2xl font-bold">{uptimePercent}%</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="text-xs text-zinc-500 mb-1">Avg Response</div>
          <div className="text-2xl font-bold">
            {monitor.lastResponseTime != null ? `${monitor.lastResponseTime}ms` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Checks</div>
          <div className="text-2xl font-bold">{monitor.totalChecks}</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="text-xs text-zinc-500 mb-1">Interval</div>
          <div className="text-2xl font-bold flex items-center gap-1.5">
            <Timer className="w-5 h-5 text-zinc-500" />
            {monitor.interval}s
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Response Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: '#71717a', fontSize: 11 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickFormatter={(v) => `${v}ms`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: number) => [`${value}ms`, 'Response Time']}
              />
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRT)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Status History</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: '#71717a', fontSize: 11 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: '#71717a', fontSize: 11 }}
                ticks={[0, 1]}
                tickFormatter={(v) => (v === 1 ? 'Up' : 'Down')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [
                  value === 1 ? 'Up' : 'Down',
                  'Status',
                ]}
              />
              <Line
                type="stepAfter"
                dataKey="status"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Checks</h3>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600">No checks recorded yet</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 text-sm py-2 border-b border-white/5 last:border-0"
              >
                {c.status === 'up' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className="text-zinc-500 font-mono text-xs w-12">
                  {c.statusCode || 'ERR'}
                </span>
                <span className="text-zinc-400 w-20">{c.responseTime}ms</span>
                {c.error && (
                  <span className="text-red-400 text-xs truncate flex-1">
                    {c.error}
                  </span>
                )}
                <span className="text-zinc-600 text-xs ml-auto whitespace-nowrap">
                  {new Date(c.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
