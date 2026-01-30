"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ViolationWarningProps {
  open: boolean;
  warningCount: number;
  maxWarnings?: number;
  onClose?: () => void;
}

export function ViolationWarning({
  open,
  warningCount,
  maxWarnings = 3,
  onClose,
}: ViolationWarningProps) {
  const remainingWarnings = maxWarnings - warningCount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Security Warning
          </DialogTitle>
          <DialogDescription>
            You have violated exam security rules.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-red-900">
              Warning {warningCount} of {maxWarnings}
            </p>
            <p className="text-sm text-red-700 mt-2">
              {remainingWarnings > 0
                ? `You have ${remainingWarnings} warning(s) remaining. Please stay focused on the exam window.`
                : "Maximum warnings reached. Your exam will be automatically submitted."}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Exam Rules:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Do not switch tabs or windows</li>
              <li>Keep the exam window in focus</li>
              <li>Do not use right-click or copy functions</li>
              <li>Stay in full-screen mode</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
