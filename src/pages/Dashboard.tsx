import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Monitor } from '../types';
import { MonitorCard } from '../components/MonitorCard';
import { StatsCard } from '../components/StatsCard';
import {
  Plus,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  monitors: Monitor[];
  setMonitors: React.Dispatch<React.SetStateAction<Monitor[]>>;
  onAddClick: () => void;
}

export function Dashboard({ monitors, setMonitors, onAddClick }: DashboardProps) {
  const [loading, setLoading] = useState(true);

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await api.monitors.list();
      setMonitors(res.monitors);
    } catch {}
    setLoading(false);
  }, [setMonitors]);

  const triggerChecks = useCallback(async () => {
    try {
      await fetch('/api/monitors/check');
    } catch {}
  }, []);

  useEffect(() => {
    fetchMonitors();
    triggerChecks();
    const pollInterval = setInterval(fetchMonitors, 15000);
    const checkInterval = setInterval(triggerChecks, 60000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(checkInterval);
    };
  }, [fetchMonitors, triggerChecks]);

  const handleDelete = (id: string) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  };

  const upCount = monitors.filter((m) => m.status === 'up').length;
  const downCount = monitors.filter((m) => m.status === 'down').length;
  const avgResponse =
    monitors.filter((m) => m.lastResponseTime != null).length > 0
      ? Math.round(
          monitors
            .filter((m) => m.lastResponseTime != null)
            .reduce((sum, m) => sum + (m.lastResponseTime || 0), 0) /
            monitors.filter((m) => m.lastResponseTime != null).length
        )
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-zinc-600 text-xs mt-0.5">
              Monitor your services and endpoints
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMonitors}
              className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium transition-all cursor-pointer shadow-[0_4px_20px_-4px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_28px_-4px_rgba(139,92,246,0.5)]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Monitor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
          <StatsCard
            label="Total"
            value={monitors.length}
            icon={<Activity className="w-3.5 h-3.5 text-violet-400" />}
          />
          <StatsCard
            label="Operational"
            value={upCount}
            icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
          />
          <StatsCard
            label="Down"
            value={downCount}
            icon={<XCircle className="w-3.5 h-3.5 text-red-400" />}
          />
          <StatsCard
            label="Avg Response"
            value={avgResponse > 0 ? `${avgResponse}ms` : '—'}
            icon={<Clock className="w-3.5 h-3.5 text-blue-400" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-zinc-600 text-sm">
          <span className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          Loading monitors...
        </div>
      ) : monitors.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-zinc-700" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No monitors yet</h3>
          <p className="text-zinc-600 text-xs mb-4">Add your first monitor to get started</p>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium transition-all cursor-pointer shadow-[0_4px_20px_-4px_rgba(139,92,246,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Monitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
