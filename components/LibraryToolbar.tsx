'use client';

import { SelectModeToggle } from '@/components/LibraryClientShell';
import { QuickAddBookModal } from '@/components/QuickAddBookModal';
import { useUserSettings } from '@/lib/hooks/use-user-settings';

export function LibraryToolbar() {
  const { settings } = useUserSettings();

  return (
    <div className="flex items-center gap-2">
      {settings.enableBulkActions && <SelectModeToggle />}
      <QuickAddBookModal />
    </div>
  );
}
