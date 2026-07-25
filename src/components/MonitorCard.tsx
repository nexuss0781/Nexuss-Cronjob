import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Monitor, CheckResult } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import {
  Clock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Timer,
  XCircle,
  CheckCircle,
} from 'lucide-react';

interface MonitorCardProps {
  monitor: Monitor;
  onDelete: (id: string) => void;
}

export function MonitorCard({ monitor, onDelete }: MonitorCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.monitors.history(monitor.id, 20);
      setHistory(res.results);
    } catch {}
    setLoading(false);
    setExpanded(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this monitor?')) return;
    try {
      await api.monitors.delete(monitor.id);
      onDelete(monitor.id);
    } catch {}
  };

  const uptimePercent =
    monitor.totalChecks > 0
      ? Math.round(
          ((monitor.totalChecks - monitor.failedChecks) / monitor.totalChecks) * 100
        )
      : 0;

  return (
    <div
      className="rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] transition-all cursor-pointer group"
      onClick={() => navigate(`/monitor/${monitor.id}`)}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate text-sm group-hover:text-white transition-colors">{monitor.name}</h3>
              <StatusBadge status={monitor.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.03] font-mono text-zinc-500 shrink-0 text-[10px]">
                {monitor.method}
              </span>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-zinc-400 truncate max-w-[200px] sm:max-w-[300px] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {monitor.url}
                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-0.5 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleExpand}
              className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-all cursor-pointer"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-500/[0.08] text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
          <div>
            <div className="text-[10px] text-zinc-600 mb-0.5">Uptime</div>
            <div className="text-sm font-semibold">{uptimePercent}%</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-600 mb-0.5">Response</div>
            <div className="text-sm font-semibold">
              {monitor.lastResponseTime != null ? `${monitor.lastResponseTime}ms` : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-600 mb-0.5">Status Code</div>
            <div className="text-sm font-semibold">
              {monitor.lastStatusCode != null ? monitor.lastStatusCode : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-600 mb-0.5">Interval</div>
            <div className="text-sm font-semibold flex items-center gap-1">
              <Timer className="w-3 h-3 text-zinc-600" />
              {monitor.interval}s
            </div>
          </div>
        </div>

        {monitor.lastCheck && (
          <div className="mt-3 text-[10px] text-zinc-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last checked: {new Date(monitor.lastCheck).toLocaleString()}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-white/[0.04] p-4 sm:p-5 animate-slide-down">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">
            Recent Checks
          </h4>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              Loading...
            </div>
          ) : history.length === 0 ? (
            <div className="text-xs text-zinc-700">No checks recorded yet</div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {history.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-2 sm:gap-3 text-sm py-1.5 border-b border-white/[0.03] last:border-0"
                >
                  {check.status === 'up' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <span className="text-zinc-600 font-mono text-[10px] w-10 shrink-0">
                    {check.statusCode || 'ERR'}
                  </span>
                  <span className="text-zinc-500 text-xs shrink-0">{check.responseTime}ms</span>
                  {check.error && (
                    <span className="text-red-400/80 text-[10px] truncate flex-1">{check.error}</span>
                  )}
                  <span className="text-zinc-700 text-[10px] ml-auto whitespace-nowrap">
                    {new Date(check.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
