import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Activity,
  LayoutDashboard,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  monitors: { id: string; name: string; status: string }[];
  onAddClick: () => void;
}

export function Sidebar({ monitors, onAddClick }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)] shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-sm">Nexuss</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]">
            <Activity className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-600 hover:text-zinc-300 transition-all cursor-pointer hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        <button
          onClick={() => navigate('/')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
            isActive('/')
              ? 'bg-violet-500/[0.1] text-violet-300 shadow-[inset_0_0_20px_-8px_rgba(139,92,246,0.15)]'
              : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
          )}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => { onAddClick(); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Add Monitor</span>}
        </button>

        {!collapsed && monitors.length > 0 && (
          <div className="pt-4 pb-1.5 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700">
              Monitors
            </span>
          </div>
        )}

        {monitors.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/monitor/${m.id}`)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer',
              location.pathname === `/monitor/${m.id}`
                ? 'bg-white/[0.04] text-white'
                : 'text-zinc-600 hover:bg-white/[0.02] hover:text-zinc-400'
            )}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-[#0c0c14]',
                m.status === 'up' && 'bg-emerald-400 ring-emerald-400/20',
                m.status === 'down' && 'bg-red-400 ring-red-400/20',
                m.status === 'pending' && 'bg-yellow-400 ring-yellow-400/20'
              )}
            />
            {!collapsed && <span className="truncate text-xs">{m.name}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2.5 border-t border-white/[0.04]">
        {!collapsed && (
          <div className="px-3 py-2 mb-1.5">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-600 hover:bg-white/[0.03] hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#0e0e16]/80 backdrop-blur-lg border border-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-white/[0.04] bg-[#0a0a12]/95 backdrop-blur-xl transition-all duration-300 lg:sticky',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[60px]' : 'w-60'
        )}
      >
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
