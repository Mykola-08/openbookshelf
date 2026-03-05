"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

export const ONBOARDING_DONE_KEY = "openbookshelf_onboarding_done";

export function openOnboardingDialog() {
  window.dispatchEvent(new Event('open-onboarding'));
}

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-onboarding', handleOpen);
    
    // Check if first time
    if (typeof window !== 'undefined' && !localStorage.getItem(ONBOARDING_DONE_KEY)) {
      setOpen(true);
    }

    return () => window.removeEventListener('open-onboarding', handleOpen);
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_DONE_KEY, "true");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to OpenBookshelf</DialogTitle>
          <DialogDescription>
            Your minimalist, hyper-personal reading environment. Let's get you set up.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">We focus on clean typography, ease of use, and letting you connect freely anywhere.</p>
            <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
              <li>Add remote libraries in one click.</li>
              <li>Read cleanly with adjustable typography.</li>
              <li>Socialize with notes implicitly.</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
