import { useEffect } from "react";

interface UseMutationObserverOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export const useMutationObserver = (
  callback: () => void,
  shouldTrigger: (mutations: MutationRecord[]) => boolean,
  options: UseMutationObserverOptions = {},
) => {
  const { enabled = true, debounceMs = 50 } = options;

  useEffect(() => {
    if (!enabled) return;

    let timeout: NodeJS.Timeout;
    const debouncedCallback = () => {
      clearTimeout(timeout);
      timeout = setTimeout(callback, debounceMs);
    };

    const observer = new MutationObserver((mutations) => {
      if (shouldTrigger(mutations)) {
        debouncedCallback();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [enabled, callback, shouldTrigger, debounceMs]);
};
