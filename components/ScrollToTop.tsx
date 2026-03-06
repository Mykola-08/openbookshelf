'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/lib/hooks/use-user-settings';

export function ScrollToTop() {
  const { settings } = useUserSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!settings.enableScrollToTop || !visible) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg border hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4" />
    </Button>
  );
}
