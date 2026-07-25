import clsx from 'clsx';

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{label}</span>
        <div className={clsx('p-2 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.05] transition-all')}>{icon}</div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
