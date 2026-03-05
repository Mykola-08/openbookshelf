export default function StatusPill({ status }: { status: string }) {
  let colorClass = 'bg-gray-100 text-gray-800';
  let label = status;

  switch (status) {
    case 'reading':
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      label = 'Reading';
      break;
    case 'finished':
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      label = 'Read';
      break;
    case 'toread':
      colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      label = 'To Read';
      break;
    case 'abandoned':
      colorClass = 'bg-red-50 text-red-800 border-red-200';
      label = 'DNF';
      break;
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}
