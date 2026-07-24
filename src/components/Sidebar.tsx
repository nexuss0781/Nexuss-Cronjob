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
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Nexuss</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto">
            <Activity className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          onClick={() => navigate('/')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
            isActive('/') ? 'bg-violet-500/15 text-violet-300' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          )}
        >
          <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => { onAddClick(); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span>Add Monitor</span>}
        </button>

        {!collapsed && (
          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
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
                ? 'bg-white/[0.06] text-white'
                : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
            )}
          >
            <span
              className={clsx(
                'w-2 h-2 rounded-full shrink-0',
                m.status === 'up' && 'bg-emerald-400',
                m.status === 'down' && 'bg-red-400',
                m.status === 'pending' && 'bg-yellow-400'
              )}
            />
            {!collapsed && <span className="truncate">{m.name}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-white/5 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#111118] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-white/5 bg-[#0c0c14] transition-all duration-300 lg:sticky',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
