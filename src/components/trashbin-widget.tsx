import React, { useCallback, useEffect, useRef } from "react";
import { useTrashbinStore } from "../store/trashbin-store";
import { TRASH_ICON } from "../lib/icons";

export const TrashbinWidget: React.FC = () => {
  const trashbinStore = useTrashbinStore();
  const widgetRef = useRef<Spicetify.Playbar.Widget | null>(null);

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
      TRASH_ICON,
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

  useEffect(updateWidget, [
    trashbinStore.currentTrack,
    trashbinStore.trashSongList,
    trashbinStore.widgetEnabled,
    trashbinStore.trashbinEnabled,
    updateWidget,
  ]);

  return null;
};
