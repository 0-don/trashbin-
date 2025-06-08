import React, { useEffect, useRef } from "react";
import { MESSAGES } from "../lib/constants";
import { useTrashbinStore } from "../store/trashbin-store";
import { TRASH_ICON } from "./icons";

export const TrashbinWidget = React.memo(() => {
  const store = useTrashbinStore();
  const widgetRef = useRef<Spicetify.Playbar.Widget | null>(null);

  const updateWidgetState = (widget: Spicetify.Playbar.Widget) => {
    const currentTrack = Spicetify.Player.data?.item;
    if (!currentTrack) return;

    const isTrack =
      Spicetify.URI.fromString(currentTrack.uri).type ===
      Spicetify.URI.Type.TRACK;
    const isTrashed = !!store.trashSongList[currentTrack.uri];

    if (isTrack) {
      widget.active = isTrashed;
      widget.label = isTrashed ? MESSAGES.UNTHROW : MESSAGES.THROW;
    } else {
      widget.deregister();
    }
  };

  useEffect(() => {
    const widget = new Spicetify.Playbar.Widget(
      MESSAGES.THROW,
      TRASH_ICON(20),
      () => {
        const currentTrack = Spicetify.Player.data?.item;
        if (currentTrack) store.toggleSongTrash(currentTrack.uri);
      },
      false,
      false,
      store.widgetEnabled && store.trashbinEnabled,
    );

    widgetRef.current = widget;

    updateWidgetState(widget);

    const handleSongChange = () => updateWidgetState(widget);
    Spicetify.Player.addEventListener("songchange", handleSongChange);

    return () => {
      Spicetify.Player.removeEventListener("songchange", handleSongChange);
      widget.deregister();
    };
  }, [store.trashbinEnabled, store.widgetEnabled, store.trashSongList]);

  return null;
});
