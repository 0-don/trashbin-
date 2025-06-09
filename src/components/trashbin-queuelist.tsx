import React, { useEffect, useRef } from "react";
import { useTrashbinStore } from "../store/trashbin-store";
import { TRASH_ICON } from "./icons";

const CLASS_NAMES = {
  TRASHBIN_BUTTON: "trashbin-queue-btn",
} as const;

const SELECTORS = {
  QUEUE_ASIDE: 'aside[aria-label="Queue"]',
  LIST_ROW: '[role="row"]',
  MORE_BUTTON: 'button[aria-haspopup="menu"]',
  TRASHBIN_BUTTON: `.${CLASS_NAMES.TRASHBIN_BUTTON}`,
} as const;

const TRACK_URI_REGEX = /spotify:track:([a-zA-Z0-9]+)/;

export const TrashbinQueuelist: React.FC = () => {
  const observerRef = useRef<MutationObserver | null>(null);
  const store = useTrashbinStore();

  const extractTrackData = (listRow: Element) => {
    const reactKey = Object.keys(listRow).find((k) => k.includes("react"));
    let fiber = reactKey && (listRow as any)[reactKey];

    while (fiber) {
      const propsString = JSON.stringify(
        fiber.memoizedProps || fiber.props || {},
      );
      const match = propsString.match(TRACK_URI_REGEX);
      if (match) return match[0];
      fiber = fiber.return;
    }
    return null;
  };

  const injectTrashButtons = () => {
    document
      .querySelectorAll(SELECTORS.TRASHBIN_BUTTON)
      .forEach((btn) => btn.remove());

    const queueAside = document.querySelector(SELECTORS.QUEUE_ASIDE);
    if (!queueAside) return;

    const moreButtons = queueAside.querySelectorAll(SELECTORS.MORE_BUTTON);

    moreButtons.forEach((moreBtn) => {
      const listRow = moreBtn.closest(SELECTORS.LIST_ROW);
      if (!listRow) return;

      const trackURI = extractTrackData(listRow);
      if (!trackURI) return;

      if (listRow.querySelector(SELECTORS.TRASHBIN_BUTTON)) return;

      const isTrashed = !!store.trashSongList[trackURI];
      const btn = document.createElement("button");
      btn.className = `${CLASS_NAMES.TRASHBIN_BUTTON} bg-transparent border-none p-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity`;
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

  useEffect(() => {
    if (!store.trashbinEnabled) return;

    observerRef.current = new MutationObserver((mutations) => {
      const hasQueueChanges = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          const element = node as Element;

          const isQueueRelated =
            element.closest?.(SELECTORS.QUEUE_ASIDE) ||
            element.querySelector?.(SELECTORS.QUEUE_ASIDE);

          return (
            isQueueRelated &&
            !element.classList?.contains(CLASS_NAMES.TRASHBIN_BUTTON)
          );
        }),
      );

      if (hasQueueChanges) setTimeout(injectTrashButtons, 50);
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observerRef.current?.disconnect();
  }, [store.trashbinEnabled, store.trashSongList]);

  return null;
};
