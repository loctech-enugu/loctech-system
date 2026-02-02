"use client";

import { Button } from "@/components/ui/button";
import { usePWAInstallPrompt } from "@/hooks/use-pwa";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export default function InstallPrompt() {
  const { canInstall, promptInstall, isIos, isInStandaloneMode } =
    usePWAInstallPrompt();
  const [open, setOpen] = useState(true); // Show dialog on load if install possible
  console.log(open, canInstall);

  if (isIos && !isInStandaloneMode) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription>
              On iOS Safari, tap the{" "}
              <span role="img" aria-label="share">
                🔗
              </span>{" "}
              icon, then choose <strong>Add to Home Screen</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (canInstall) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Install {process.env.NEXT_PUBLIC_APP_NAME || "this app"}
            </DialogTitle>
            <DialogDescription>
              Add this app to your device for quick access — works offline too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Later
            </Button>
            <Button
              onClick={async () => {
                await promptInstall();
                setOpen(false);
              }}
            >
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
