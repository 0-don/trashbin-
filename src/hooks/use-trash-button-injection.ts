import { useEffect } from "react";
import { TRASH_ICON } from "../components/icons";
import { extractTrackData, manageSmartShuffleQueue } from "../lib/track-utils";
import { useTrashbinStore } from "../store/trashbin-store";
import { useMutationObserver } from "./use-mutation-observer";

interface TrashButtonConfig {
  containerSelector: string;
  buttonSelector: string;
  rowSelector: string;
  moreButtonSelector: string;
  buttonClassName: string;
}

export const useTrashButtonInjection = (
  config: TrashButtonConfig,
  enabled: boolean = true,
) => {
  const store = useTrashbinStore();

  const removeTrashButtons = () => {
    document
      .querySelectorAll(config.buttonSelector)
      .forEach((btn) => btn.remove());
  };

  const injectTrashButtons = async () => {
    // Remove existing buttons first
    removeTrashButtons();

    // Don't inject if not enabled
    if (!enabled || !store.trashbinEnabled) return;

    const container = document.querySelector(config.containerSelector);
    if (!container) return;

    await manageSmartShuffleQueue();

    container.querySelectorAll(config.moreButtonSelector).forEach((moreBtn) => {
      const row = moreBtn.closest(config.rowSelector);
      if (!row) return;

      const { trackURI } = extractTrackData(row);
      if (!trackURI || row.querySelector(config.buttonSelector)) return;

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

      moreBtn.parentElement?.insertBefore(btn, moreBtn);
    });
  };

  // Remove buttons when disabled
  useEffect(() => {
    if (!enabled || !store.trashbinEnabled) {
      removeTrashButtons();
    } else {
      injectTrashButtons();
    }
  }, [enabled, store.trashbinEnabled, removeTrashButtons, injectTrashButtons]);

  const shouldTrigger = (mutations: MutationRecord[]): boolean =>
    mutations.some((mutation) =>
      Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node as Element;
        return (
          (element.closest?.(config.containerSelector) ||
            element.querySelector?.(config.containerSelector)) &&
          !element.classList?.contains(config.buttonClassName.split(" ")[0])
        );
      }),
    );

  useMutationObserver(injectTrashButtons, shouldTrigger, {
    enabled: store.trashbinEnabled && enabled,
  });
};
