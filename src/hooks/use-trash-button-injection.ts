import { useCallback } from "react";
import { TRASH_ICON } from "../components/icons";
import { extractTrackData } from "../lib/track-utils";
import { useTrashbinStore } from "../store/trashbin-store";
import { useMutationObserver } from "./use-mutation-observer";

interface TrashButtonConfig {
  containerSelector: string;
  buttonSelector: string;
  rowSelector: string;
  moreButtonSelector: string;
  buttonClassName: string;
  buttonContainer?: (moreButton: Element) => Element | null;
}

export const useTrashButtonInjection = (config: TrashButtonConfig) => {
  const store = useTrashbinStore();

  const createTrashButton = useCallback(
    (trackURI: string): HTMLButtonElement => {
      const isTrashed = !!store.trashSongList[trackURI];
      const btn = document.createElement("button");
      btn.className = `${config.buttonClassName} bg-transparent border-none p-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity`;
      btn.innerHTML = TRASH_ICON(16, isTrashed ? "text-green-500" : "");
      btn.dataset.visuallyTrashed = isTrashed.toString();

      btn.onclick = (e) => {
        e.stopPropagation();
        const newState = btn.dataset.visuallyTrashed !== "true";
        btn.innerHTML = TRASH_ICON(16, newState ? "text-green-500" : "");
        btn.dataset.visuallyTrashed = newState.toString();
        store.toggleSongTrash(trackURI);
      };

      return btn;
    },
    [store, config.buttonClassName],
  );

  const injectTrashButtons = useCallback(() => {
    // Remove existing buttons
    document
      .querySelectorAll(config.buttonSelector)
      .forEach((btn) => btn.remove());

    console.log(new Date(), config.buttonSelector);

    const container = document.querySelector(config.containerSelector);
    if (!container) return;

    const moreButtons = container.querySelectorAll(config.moreButtonSelector);

    moreButtons.forEach((moreBtn) => {
      const row = moreBtn.closest(config.rowSelector);
      if (!row) return;

      const { trackURI } = extractTrackData(row);
      if (!trackURI) return;

      // Skip if button already exists
      if (row.querySelector(config.buttonSelector)) return;

      const btn = createTrashButton(trackURI);

      // Get container for button (either custom logic or default)
      const buttonContainer = config.buttonContainer
        ? config.buttonContainer(moreBtn)
        : moreBtn.parentElement;

      buttonContainer?.insertBefore(btn, moreBtn);
    });
  }, [config, createTrashButton]);

  const shouldTrigger = useCallback(
    (mutations: MutationRecord[]): boolean => {
      return mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          const element = node as Element;

          const isRelevant =
            element.closest?.(config.containerSelector) ||
            element.querySelector?.(config.containerSelector);

          return (
            isRelevant &&
            !element.classList?.contains(config.buttonClassName.split(" ")[0])
          );
        }),
      );
    },
    [config],
  );

  useMutationObserver(injectTrashButtons, shouldTrigger, {
    enabled: store.trashbinEnabled,
  });
};
