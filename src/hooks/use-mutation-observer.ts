import { useEffect } from "react";

interface UseMutationObserverOptions {
  enabled?: boolean;
}

export const useMutationObserver = (
  callback: () => void,
  shouldTrigger: (mutations: MutationRecord[]) => boolean,
  options: UseMutationObserverOptions = {},
) => {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const observer = new MutationObserver((mutations) => {
      if (shouldTrigger(mutations)) {
        callback();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [enabled, callback, shouldTrigger]);
};
