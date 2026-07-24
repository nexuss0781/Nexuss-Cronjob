import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Monitor } from '../types';
import { Layout } from '../components/Layout';
import { MonitorCard } from '../components/MonitorCard';
import { AddMonitorModal } from '../components/AddMonitorModal';
import { StatsCard } from '../components/StatsCard';
import {
  Plus,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

export function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await api.monitors.list();
      setMonitors(res.monitors);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const triggerChecks = useCallback(async () => {
    try {
      await fetch('/api/monitors/check');
    } catch { /* ignore */ }
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

  const handleAdd = (monitor: Monitor) => {
    setMonitors((prev) => [monitor, ...prev]);
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
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Monitor your services and endpoints
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMonitors}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Monitor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Total Monitors"
            value={monitors.length}
            icon={<Activity className="w-4 h-4 text-violet-400" />}
          />
          <StatsCard
            label="Operational"
            value={upCount}
            icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
          />
          <StatsCard
            label="Down"
            value={downCount}
            icon={<XCircle className="w-4 h-4 text-red-400" />}
          />
          <StatsCard
            label="Avg Response"
            value={avgResponse > 0 ? `${avgResponse}ms` : '—'}
            icon={<Clock className="w-4 h-4 text-blue-400" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading monitors...</div>
      ) : monitors.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium mb-1">No monitors yet</h3>
          <p className="text-zinc-500 text-sm mb-4">Add your first monitor to get started</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Monitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddMonitorModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </Layout>
  );
}
