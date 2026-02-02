"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Violation {
  type: string;
  timestamp: Date;
}

interface UseExamSecurityOptions {
  onViolation?: (violation: Violation) => void;
  maxViolations?: number;
  onMaxViolations?: () => void;
  enabled?: boolean;
}

export function useExamSecurity(options: UseExamSecurityOptions = {}) {
  const {
    onViolation,
    maxViolations = 5,
    onMaxViolations,
    enabled = true,
  } = options;

  const [violations, setViolations] = useState<Violation[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const violationCountRef = useRef(0);

  // Track violations
  const recordViolation = useCallback(
    (type: string) => {
      if (!enabled) return;

      const violation: Violation = {
        type,
        timestamp: new Date(),
      };

      setViolations((prev) => [...prev, violation]);
      violationCountRef.current += 1;

      if (onViolation) {
        onViolation(violation);
      }

      if (violationCountRef.current >= maxViolations && onMaxViolations) {
        onMaxViolations();
      }
    },
    [enabled, maxViolations, onViolation, onMaxViolations]
  );

  // Tab/Focus detection
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("tab-switch");
        setWarningCount((prev) => prev + 1);
      }
    };

    const handleBlur = () => {
      recordViolation("focus-lost");
    };

    const handleFocus = () => {
      // Reset warning count after some time
      setTimeout(() => {
        setWarningCount(0);
      }, 5000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, recordViolation]);

  // Full-screen detection
  useEffect(() => {
    if (!enabled) return;

    const handleFullScreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullScreen(isFull);

      if (!isFull && isFullScreen) {
        recordViolation("exit-fullscreen");
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
    };
  }, [enabled, isFullScreen, recordViolation]);

  // Right-click prevention
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation("right-click");
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, recordViolation]);

  // Copy prevention
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation("copy-attempt");
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation("cut-attempt");
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
    };
  }, [enabled, recordViolation]);

  // Keyboard shortcuts prevention
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        recordViolation("devtools-attempt");
      }

      // Prevent Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
        e.preventDefault();
        recordViolation("keyboard-shortcut");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, recordViolation]);

  // Request full-screen on mount
  const requestFullScreen = useCallback(async () => {
    if (!enabled) return;

    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      setIsFullScreen(true);
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  }, [enabled]);

  return {
    violations,
    violationCount: violationCountRef.current,
    warningCount,
    isFullScreen,
    requestFullScreen,
    recordViolation,
  };
}
