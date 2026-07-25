import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Monitor, CheckResult } from '../types';
import { timeAgo } from '../lib/time';
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
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!monitor) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer shrink-0 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">{monitor.name}</h1>
            <StatusBadge status={monitor.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.03] font-mono text-zinc-500 text-[10px]">
              {monitor.method}
            </span>
            <Globe className="w-3 h-3 shrink-0" />
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors truncate"
            >
              {monitor.url}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-red-500/[0.08] text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-[10px] text-zinc-600 mb-1">Uptime</div>
          <div className="text-xl font-bold">{uptimePercent}%</div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-[10px] text-zinc-600 mb-1">Avg Response</div>
          <div className="text-xl font-bold">
            {monitor.lastResponseTime != null ? `${monitor.lastResponseTime}ms` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-[10px] text-zinc-600 mb-1">Total Checks</div>
          <div className="text-xl font-bold">{monitor.totalChecks}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-[10px] text-zinc-600 mb-1">Interval</div>
          <div className="text-xl font-bold flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-zinc-600" />
            {monitor.interval}s
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 sm:p-5">
          <h3 className="text-xs font-semibold text-zinc-500 mb-4">Response Time</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.1)"
                  tick={{ fill: '#52525b', fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.1)"
                  tick={{ fill: '#52525b', fontSize: 10 }}
                  tickFormatter={(v) => `${v}ms`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e0e16',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#71717a' }}
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
        </div>
      )}

      {chartData.length > 1 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 sm:p-5">
          <h3 className="text-xs font-semibold text-zinc-500 mb-4">Status History</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.1)"
                  tick={{ fill: '#52525b', fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.1)"
                  tick={{ fill: '#52525b', fontSize: 10 }}
                  ticks={[0, 1]}
                  tickFormatter={(v) => (v === 1 ? 'Up' : 'Down')}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e0e16',
                    border: '1px solid rgba(255,255,255,0.06)',
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
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 sm:p-5">
        <h3 className="text-xs font-semibold text-zinc-500 mb-4">Recent Checks</h3>
        {history.length === 0 ? (
          <p className="text-xs text-zinc-700">No checks recorded yet</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {history.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 sm:gap-3 text-sm py-2 border-b border-white/[0.03] last:border-0"
              >
                {c.status === 'up' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span className="text-zinc-600 font-mono text-[10px] w-10 shrink-0">
                  {c.statusCode || 'ERR'}
                </span>
                <span className="text-zinc-500 text-xs shrink-0">{c.responseTime}ms</span>
                {c.error && (
                  <span className="text-red-400/80 text-[10px] truncate flex-1">{c.error}</span>
                )}
                <span className="text-zinc-700 text-[10px] ml-auto whitespace-nowrap">
                  {timeAgo(c.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
