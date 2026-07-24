import clsx from 'clsx';

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
        <div className={clsx('p-2 rounded-lg bg-white/5')}>{icon}</div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
