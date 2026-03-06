'use client';

import { useBulkSelection } from '@/components/BulkActions';
import { Check } from 'lucide-react';

interface SelectableBookWrapperProps {
  userBookId: string;
  children: React.ReactNode;
}

export function SelectableBookWrapper({ userBookId, children }: SelectableBookWrapperProps) {
  const { selected, toggle, isSelecting } = useBulkSelection();
  const isSelected = selected.has(userBookId);

  if (!isSelecting) return <>{children}</>;

  return (
    <div
      className={`relative cursor-pointer rounded-xl transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'hover:ring-2 hover:ring-muted-foreground/20 hover:ring-offset-1'
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(userBookId);
      }}
    >
      {children}
      <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
        isSelected
          ? 'bg-primary border-primary text-primary-foreground scale-110'
          : 'bg-background/80 border-border backdrop-blur-sm'
      }`}>
        {isSelected && <Check className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
}
