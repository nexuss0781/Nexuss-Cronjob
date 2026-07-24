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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#111118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold">Add Monitor</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3 block">
              Quick Start Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => selectTemplate(i)}
                  className={clsx(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer',
                    selectedTemplate === i
                      ? 'border-violet-500/50 bg-violet-500/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {i < 2 ? <Globe className="w-3.5 h-3.5 text-violet-400" /> : <Send className="w-3.5 h-3.5 text-violet-400" />}
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-violet-500/50 focus:outline-none transition-colors"
                  placeholder="My API"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-violet-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m} className="bg-[#111118]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-mono focus:border-violet-500/50 focus:outline-none transition-colors"
                placeholder="https://api.example.com/health"
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Check Interval
              </label>
              <div className="flex gap-2 flex-wrap">
                {INTERVALS.map((iv) => (
                  <button
                    key={iv.value}
                    type="button"
                    onClick={() => { setInterval(iv.value); setCustomInterval(''); }}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
                      interval === iv.value && customInterval === ''
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10'
                    )}
                  >
                    {iv.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setInterval(CUSTOM_INTERVAL_VALUE); }}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
                    interval === CUSTOM_INTERVAL_VALUE
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10'
                  )}
                >
                  Custom
                </button>
              </div>
              {interval === CUSTOM_INTERVAL_VALUE && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={86400}
                    value={customInterval}
                    onChange={(e) => setCustomInterval(e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:border-violet-500/50 focus:outline-none transition-colors"
                    placeholder="seconds"
                  />
                  <span className="text-sm text-zinc-500">seconds (min 10, max 86400)</span>
                </div>
              )}
            </div>

            {method !== 'GET' && (
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">Request Body (JSON)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-mono focus:border-violet-500/50 focus:outline-none transition-colors h-24 resize-none"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Custom Headers (JSON, optional)</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-mono focus:border-violet-500/50 focus:outline-none transition-colors h-20 resize-none"
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Monitor'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
