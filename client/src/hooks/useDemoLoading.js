import { useEffect, useState } from "react";

function getInitialLoadingState(storageKey) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(storageKey) !== "true";
  } catch {
    return false;
  }
}

export function useDemoLoading(key, durationMs = 900) {
  const storageKey = `educa:page-loaded:${key}`;
  const [isLoading, setIsLoading] = useState(() => getInitialLoadingState(storageKey));

  useEffect(() => {
    if (!isLoading || typeof window === "undefined") {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(storageKey, "true");
      } catch {
        // Ignore storage write issues in private or restricted contexts.
      }

      setIsLoading(false);
    }, durationMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [durationMs, isLoading, storageKey]);

  return isLoading;
}
