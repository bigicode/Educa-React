import { useEffect, useState } from "react";

const SPLASH_STORAGE_KEY = "educa:splash-shown";

const splashSession = {
  startedAt: 0,
  completed: false,
};

function getInitialPhase() {
  if (typeof window === "undefined") {
    return "ready";
  }

  try {
    const hasStoredSplash = window.sessionStorage.getItem(SPLASH_STORAGE_KEY) === "true";

    if (hasStoredSplash || splashSession.completed) {
      splashSession.completed = true;
      return "ready";
    }

    if (!splashSession.startedAt) {
      splashSession.startedAt = Date.now();
    }

    return "splash";
  } catch {
    return "ready";
  }
}

export function useSessionSplash(durationMs) {
  const [phase, setPhase] = useState(getInitialPhase);

  useEffect(() => {
    if (phase !== "splash" || typeof window === "undefined") {
      return undefined;
    }

    const elapsed = Date.now() - splashSession.startedAt;
    const remaining = Math.max(durationMs - elapsed, 0);

    const timerId = window.setTimeout(() => {
      try {
        splashSession.completed = true;
        window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "true");
      } catch {
        splashSession.completed = true;
      }

      setPhase("ready");
    }, remaining);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [durationMs, phase]);

  return {
    showSplash: phase === "splash",
    isReady: phase === "ready",
  };
}
