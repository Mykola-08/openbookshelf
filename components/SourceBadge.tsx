import { LibrarySource } from "@/types/library";
import { Globe, Lock } from "@/components/ui/icons";
import { FileText } from "@/components/ui/file-text";

export default function SourceBadge({ source }: { source: LibrarySource }) {
  // Simple icon component
  const Icon = () => {
    const iconClass = "w-3 h-3 text-gray-500";
    switch(source.type) {
      case 'public_url':
        return <Globe className={iconClass} />;
      case 'private_api':
        return <Lock className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  }

  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/95 border border-gray-200 text-xs text-gray-600 font-medium shadow-sm backdrop-blur-sm">
      <Icon />
      <span className="truncate max-w-[80px]">{source.name}</span>
    </span>
  );
}
