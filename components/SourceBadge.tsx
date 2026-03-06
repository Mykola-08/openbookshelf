import { LibrarySource } from "@/types/library";
import { Server, HardDrive, BookOpen } from "lucide-react";


const Icon = ({ type }: { type: string }) => {
  const iconClass = "w-3 h-3 text-muted-foreground";
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
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-card/95 border border-border text-xs text-muted-foreground font-medium shadow-sm backdrop-blur-sm">
      <Icon type={source.type} />
      <span className="truncate max-w-[80px]">{source.name}</span>
    </span>
  );
}
