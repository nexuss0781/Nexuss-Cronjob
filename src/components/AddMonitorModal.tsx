import { useState } from 'react';
import { api } from '../lib/api';
import { X, Globe, Send, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { Monitor } from '../types';

interface AddMonitorModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (monitor: Monitor) => void;
}

const TEMPLATES = [
  { name: 'Health Check', method: 'GET', url: 'https://', interval: 60, description: 'Basic GET request to check uptime' },
  { name: 'API Endpoint', method: 'POST', url: 'https://', interval: 120, description: 'POST request with JSON body' },
  { name: 'Webhook', method: 'POST', url: 'https://', interval: 300, description: 'Periodic webhook delivery' },
  { name: 'REST API', method: 'GET', url: 'https://', interval: 60, description: 'REST API health monitor' },
];

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const INTERVALS = [
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '1h', value: 3600 },
];
const CUSTOM_INTERVAL_VALUE = -1;

export function AddMonitorModal({ open, onClose, onAdd }: AddMonitorModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [name, setName] = useState(TEMPLATES[0].name);
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<string>(TEMPLATES[0].method);
  const [interval, setInterval] = useState(TEMPLATES[0].interval);
  const [customInterval, setCustomInterval] = useState('');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectTemplate = (idx: number) => {
    setSelectedTemplate(idx);
    setName(TEMPLATES[idx].name);
    setMethod(TEMPLATES[idx].method);
    setInterval(TEMPLATES[idx].interval);
    if (TEMPLATES[idx].method !== 'GET') {
      setBody(JSON.stringify({ key: 'value' }, null, 2));
    } else {
      setBody('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !name) {
      setError('Name and URL are required');
      return;
    }
    if (interval === CUSTOM_INTERVAL_VALUE) {
      const val = parseInt(customInterval);
      if (!customInterval || isNaN(val) || val < 10 || val > 86400) {
        setError('Custom interval must be between 10 and 86400 seconds');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      let parsedHeaders: Record<string, string> | undefined;
      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers);
      }

      const finalInterval = interval === CUSTOM_INTERVAL_VALUE ? (parseInt(customInterval) || 60) : interval;

      const res = await api.monitors.create({
        name,
        url,
        method,
        interval: finalInterval,
        headers: parsedHeaders,
        body: body || undefined,
      });
      onAdd(res.monitor);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setUrl('');
    setMethod('GET');
    setInterval(60);
    setCustomInterval('');
    setHeaders('');
    setBody('');
    setSelectedTemplate(0);
    setError('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[#0e0e16] border border-white/[0.06] rounded-2xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] animate-slide-up max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Add Monitor</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Track an endpoint's uptime</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain px-6 py-5">
          <div className="mb-5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3 block">
              Quick Start
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => selectTemplate(i)}
                  className={clsx(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer group',
                    selectedTemplate === i
                      ? 'border-violet-500/30 bg-violet-500/[0.06] shadow-[0_0_20px_-6px_rgba(139,92,246,0.2)]'
                      : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.08]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {i < 2 ? (
                      <Globe className={clsx('w-3.5 h-3.5', selectedTemplate === i ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
                    ) : (
                      <Send className={clsx('w-3.5 h-3.5', selectedTemplate === i ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
                    )}
                    <span className={clsx('text-sm font-medium', selectedTemplate === i ? 'text-white' : 'text-zinc-300')}>{t.name}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm focus:border-violet-500/40 focus:outline-none transition-all placeholder:text-zinc-700"
                  placeholder="My API"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm focus:border-violet-500/40 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m} className="bg-[#0e0e16]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-mono focus:border-violet-500/40 focus:outline-none transition-all placeholder:text-zinc-700"
                placeholder="https://api.example.com/health"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 mb-2 block flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Check Interval
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {INTERVALS.map((iv) => (
                  <button
                    key={iv.value}
                    type="button"
                    onClick={() => { setInterval(iv.value); setCustomInterval(''); }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      interval === iv.value && customInterval === ''
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25 shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]'
                        : 'bg-white/[0.03] text-zinc-500 border border-white/[0.04] hover:bg-white/[0.06] hover:text-zinc-300'
                    )}
                  >
                    {iv.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setInterval(CUSTOM_INTERVAL_VALUE); }}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                    interval === CUSTOM_INTERVAL_VALUE
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                      : 'bg-white/[0.03] text-zinc-500 border border-white/[0.04] hover:bg-white/[0.06] hover:text-zinc-300'
                  )}
                >
                  Custom
                </button>
              </div>
              {interval === CUSTOM_INTERVAL_VALUE && (
                <div className="mt-2 flex items-center gap-2 animate-slide-down">
                  <input
                    type="number"
                    min={10}
                    max={86400}
                    value={customInterval}
                    onChange={(e) => setCustomInterval(e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm font-mono focus:border-violet-500/40 focus:outline-none transition-all"
                    placeholder="seconds"
                  />
                  <span className="text-xs text-zinc-600">seconds (10 — 86400)</span>
                </div>
              )}
            </div>

            {method !== 'GET' && (
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Request Body (JSON)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-mono focus:border-violet-500/40 focus:outline-none transition-all h-24 resize-none placeholder:text-zinc-700"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Custom Headers (JSON, optional)</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-mono focus:border-violet-500/40 focus:outline-none transition-all h-20 resize-none placeholder:text-zinc-700"
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm animate-slide-down">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 cursor-pointer shadow-[0_4px_24px_-4px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_32px_-4px_rgba(139,92,246,0.5)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Monitor'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
