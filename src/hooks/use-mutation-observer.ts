import { useCallback, useEffect, useRef } from "react";

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
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, debounceMs);
  }, [callback, debounceMs]);

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new MutationObserver((mutations) => {
      if (shouldTrigger(mutations)) {
        debouncedCallback();
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, shouldTrigger, debouncedCallback]);
};
