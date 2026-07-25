import { type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Activity } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#06060b] text-white">
      <header className="border-b border-white/[0.04] bg-[#06060b]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.5)]">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Nexuss</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{user.name}</span>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-zinc-600 hover:text-zinc-300 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
