import React, { useCallback, useEffect, useRef } from "react";
import { useTrashbinStore } from "../store/trashbin-store";

export const TrashbinWidget: React.FC = () => {
  const trashbinStore = useTrashbinStore();
  const widgetRef = useRef<any>(null);

  const getCurrentTrack = useCallback(
    () => trashbinStore.currentTrack || Spicetify.Player.data?.item,
    [trashbinStore.currentTrack],
  );

  const updateWidget = useCallback(() => {
    const widget = widgetRef.current;
    const track = getCurrentTrack();

    if (!widget || !track) return;

    const uri = track.uri;
    const isTrack =
      Spicetify.URI.fromString(uri).type === Spicetify.URI.Type.TRACK;
    const isTrashed = !!trashbinStore.trashSongList[uri];
    const shouldShow =
      isTrack && trashbinStore.widgetEnabled && trashbinStore.trashbinEnabled;

    if (shouldShow) {
      widget.register();
      widget.active = isTrashed;
      widget.label = isTrashed ? "Remove from Trashbin" : "Place in Trashbin";
    } else {
      widget.deregister();
    }
  }, [
    getCurrentTrack,
    trashbinStore.trashSongList,
    trashbinStore.widgetEnabled,
    trashbinStore.trashbinEnabled,
  ]);

  // Initialize widget
  useEffect(() => {
    const widget = new Spicetify.Playbar.Widget(
      "Place in Trashbin",
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentcolor"><path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744.652L13.015 4.5H2.985z"/></svg>',
      () => {
        const track = Spicetify.Player.data?.item;
        if (!track) return;

        const uri = track.uri;
        trashbinStore.trashSongList[uri]
          ? trashbinStore.removeSongFromTrash(uri)
          : trashbinStore.addSongToTrash(uri);
      },
      false,
      false,
      false,
    );

    widgetRef.current = widget;

    // Initial setup with fallback
    const track = getCurrentTrack();
    if (track && !trashbinStore.currentTrack) {
      trashbinStore.setCurrentTrack(track);
    }

    updateWidget();
    const timeoutId = setTimeout(updateWidget, 100);

    return () => {
      clearTimeout(timeoutId);
      widget.deregister();
    };
  }, []);

  // Update on any relevant change
  useEffect(updateWidget, [
    trashbinStore.currentTrack,
    trashbinStore.trashSongList,
    trashbinStore.widgetEnabled,
    trashbinStore.trashbinEnabled,
    updateWidget,
  ]);

  return null;
};
