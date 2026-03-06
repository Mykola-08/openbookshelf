'use client';

import { useRouter } from 'next/navigation';
import { BulkSelectionProvider, BulkActionBar, useBulkSelection } from '@/components/BulkActions';
import { QuickAddBookModal } from '@/components/QuickAddBookModal';
import { CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LibraryToolbarProps {
  allUserBookIds: string[];
}

function SelectModeToggle() {
  const { isSelecting, setIsSelecting, clearAll } = useBulkSelection();

  return (
    <Button
      variant={isSelecting ? 'default' : 'outline'}
      size="sm"
      className="gap-1.5 text-xs rounded-full"
      onClick={() => {
        if (isSelecting) clearAll();
        else setIsSelecting(true);
      }}
    >
      <CheckSquare className="w-3.5 h-3.5" />
      {isSelecting ? 'Cancel Select' : 'Select'}
    </Button>
  );
}

function InnerToolbar({ allUserBookIds }: LibraryToolbarProps) {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center gap-2">
        <SelectModeToggle />
        <QuickAddBookModal />
      </div>
      <BulkActionBar allIds={allUserBookIds} onComplete={() => router.refresh()} />
    </>
  );
}

export function LibraryClientShell({ allUserBookIds, children }: LibraryToolbarProps & { children: React.ReactNode }) {
  return (
    <BulkSelectionProvider>
      {children}
      <LibraryToolbarSlot allUserBookIds={allUserBookIds} />
    </BulkSelectionProvider>
  );
}

function LibraryToolbarSlot({ allUserBookIds }: LibraryToolbarProps) {
  const router = useRouter();
  return <BulkActionBar allIds={allUserBookIds} onComplete={() => router.refresh()} />;
}

export { SelectModeToggle, QuickAddBookModal };
