import { LibrarySource } from "@/types/library";
import { Server, HardDrive, BookOpen } from "lucide-react";


const Icon = ({ type }: { type: string }) => {
  const iconClass = "w-3 h-3 text-gray-500";
  switch(type) {
    case 'calibre':
    case 'komga':
    case 'kavita':
      return <Server className={iconClass} />;
    case 'local':
      return <HardDrive className={iconClass} />;
    default:
      return <BookOpen className={iconClass} />;
  }
}

export default function SourceBadge({ source }: { source: LibrarySource }) {
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/95 border border-gray-200 text-xs text-gray-600 font-medium shadow-sm backdrop-blur-sm">
      <Icon type={source.type} />
      <span className="truncate max-w-[80px]">{source.name}</span>
    </span>
  );
}
