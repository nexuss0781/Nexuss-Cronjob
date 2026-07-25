import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'up' | 'down' | 'pending';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        status === 'up' && 'bg-emerald-500/[0.1] text-emerald-400',
        status === 'down' && 'bg-red-500/[0.1] text-red-400',
        status === 'pending' && 'bg-yellow-500/[0.1] text-yellow-400'
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          status === 'up' && 'bg-emerald-400 animate-pulse',
          status === 'down' && 'bg-red-400 animate-pulse',
          status === 'pending' && 'bg-yellow-400'
        )}
      />
      {status === 'up' ? 'Operational' : status === 'down' ? 'Down' : 'Pending'}
    </span>
  );
}
