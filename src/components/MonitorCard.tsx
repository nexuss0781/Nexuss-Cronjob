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
      className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
      onClick={() => navigate(`/monitor/${monitor.id}`)}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate text-sm sm:text-base">{monitor.name}</h3>
              <StatusBadge status={monitor.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400 shrink-0">
                {monitor.method}
              </span>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-zinc-300 truncate max-w-[200px] sm:max-w-[300px]"
                onClick={(e) => e.stopPropagation()}
              >
                {monitor.url}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={toggleExpand}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5">Uptime</div>
            <div className="text-sm font-medium">{uptimePercent}%</div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5">Response</div>
            <div className="text-sm font-medium">
              {monitor.lastResponseTime != null ? `${monitor.lastResponseTime}ms` : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5">Status Code</div>
            <div className="text-sm font-medium">
              {monitor.lastStatusCode != null ? monitor.lastStatusCode : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5">Interval</div>
            <div className="text-sm font-medium flex items-center gap-1">
              <Timer className="w-3 h-3 text-zinc-500" />
              {monitor.interval}s
            </div>
          </div>
        </div>

        {monitor.lastCheck && (
          <div className="mt-3 text-xs text-zinc-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last checked: {new Date(monitor.lastCheck).toLocaleString()}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-white/5 p-4 sm:p-5">
          <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Recent Checks
          </h4>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-zinc-500">No checks recorded yet</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-2 sm:gap-3 text-sm py-1.5 border-b border-white/5 last:border-0"
                >
                  {check.status === 'up' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-zinc-500 font-mono text-xs w-10 shrink-0">
                    {check.statusCode || 'ERR'}
                  </span>
                  <span className="text-zinc-400 text-xs sm:text-sm shrink-0">{check.responseTime}ms</span>
                  {check.error && (
                    <span className="text-red-400 text-xs truncate flex-1">{check.error}</span>
                  )}
                  <span className="text-zinc-600 text-xs ml-auto whitespace-nowrap">
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
