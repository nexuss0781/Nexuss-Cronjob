import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MonitorDetail } from './pages/MonitorDetail';
import { Sidebar } from './components/Sidebar';
import { AddMonitorModal } from './components/AddMonitorModal';
import { api } from './lib/api';
import type { Monitor } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchMonitors = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.monitors.list();
      setMonitors(res.monitors);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 15000);
    return () => clearInterval(interval);
  }, [fetchMonitors]);

  const handleAdd = (monitor: Monitor) => {
    setMonitors((prev) => [monitor, ...prev]);
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#06060b] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <Register onToggle={() => setShowRegister(false)} />
    ) : (
      <Login onToggle={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="flex h-screen bg-[#06060b] overflow-hidden">
      <Sidebar
        monitors={monitors.map((m) => ({ id: m.id, name: m.name, status: m.status }))}
        onAddClick={() => setModalOpen(true)}
      />
      <main className="flex-1 overflow-y-auto min-w-0">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                monitors={monitors}
                setMonitors={setMonitors}
                onAddClick={() => setModalOpen(true)}
              />
            }
          />
          <Route path="/monitor/:id" element={<MonitorDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <AddMonitorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
