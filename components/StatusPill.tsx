export default function StatusPill({ status }: { status: string }) {
  let colorClass = 'bg-secondary text-secondary-foreground';
  let label = status;

  switch (status) {
    case 'reading':
      colorClass = 'bg-status-info/10 text-status-info border-status-info/20';
      label = 'Reading';
      break;
    case 'finished':
      colorClass = 'bg-status-success/10 text-status-success border-status-success/20';
      label = 'Read';
      break;
    case 'toread':
      colorClass = 'bg-status-warning/10 text-status-warning border-status-warning/20';
      label = 'To Read';
      break;
    case 'abandoned':
      colorClass = 'bg-status-error/10 text-status-error border-status-error/20';
      label = 'DNF';
      break;
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`} role="status">
      {label}
    </span>
  );
}
