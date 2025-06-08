import React, { useEffect, useRef } from "react";
import { useTrashbinStore } from "../store/trashbin-store";
import { TRASH_ICON } from "./icons";

const CLASS_NAMES = {
  TRASHBIN_BUTTON: "trashbin-btn",
  ROW_MAIN_CONTENT: "main-trackList-rowMainContent",
} as const;

const SELECTORS = {
  TRACKLIST_ROW: ".main-trackList-trackListRow",
  ROW_MAIN_CONTENT: `.${CLASS_NAMES.ROW_MAIN_CONTENT}`,
  MORE_BUTTON: ".main-trackList-rowMoreButton",
  TRASHBIN_BUTTON: `.${CLASS_NAMES.TRASHBIN_BUTTON}`,
  ARTIST_LINK: 'a[href*="/artist/"]',
} as const;

const TRACK_URI_REGEX = /spotify:track:([a-zA-Z0-9]+)/;

export const TrashbinTracklist: React.FC = () => {
  const observerRef = useRef<MutationObserver | null>(null);
  const store = useTrashbinStore();

  const extractTrackData = (el: Element) => {
    const reactKey = Object.keys(el).find((k) => k.includes("react"));
    let trackURI = null;
    let fiber = reactKey && (el as any)[reactKey];

    while (fiber && !trackURI) {
      const match = JSON.stringify(
        fiber.memoizedProps || fiber.props || {},
      ).match(TRACK_URI_REGEX);
      if (match) trackURI = match[0];
      fiber = fiber.return;
    }

    const artistURIs = Array.from(
      el.querySelectorAll(SELECTORS.ARTIST_LINK),
    ).map(
      (a) =>
        `spotify:artist:${(a as HTMLAnchorElement).href.split("/artist/")[1]}`,
    );

    return { trackURI, artistURIs };
  };

  const injectTrashButtons = () => {
    document
      .querySelectorAll(SELECTORS.TRASHBIN_BUTTON)
      .forEach((btn) => btn.remove());

    document.querySelectorAll(SELECTORS.ROW_MAIN_CONTENT).forEach((el) => {
      const { trackURI, artistURIs } = extractTrackData(el);

      if (!trackURI) return;

      const row = el.closest(SELECTORS.TRACKLIST_ROW);
      const moreBtn = row?.querySelector(SELECTORS.MORE_BUTTON);
      if (!moreBtn) return;

      const isTrashed = !!store.trashSongList[trackURI];
      const btn = document.createElement("button");
      btn.className = `${CLASS_NAMES.TRASHBIN_BUTTON} bg-transparent border-none p-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity`;
      btn.innerHTML = TRASH_ICON(16, isTrashed ? "text-green-500" : "");
      btn.dataset.visuallyTrashed = isTrashed.toString();

      btn.onclick = () => {
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
      const hasTracklistChanges = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          const element = node as Element;
          return (
            !element.classList?.contains(CLASS_NAMES.TRASHBIN_BUTTON) &&
            (element.classList?.contains(CLASS_NAMES.ROW_MAIN_CONTENT) ||
              element.querySelector?.(SELECTORS.ROW_MAIN_CONTENT))
          );
        }),
      );

      if (hasTracklistChanges) setTimeout(injectTrashButtons, 50);
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return () => observerRef.current?.disconnect();
  }, [store.trashbinEnabled, store.trashSongList]);

  return null;
};
