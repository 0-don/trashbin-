import React, { useEffect, useRef } from "react";
import { useTrashbinStore } from "../store/trashbin-store";

export const TrashbinWidget: React.FC = () => {
  const trashbinStore = useTrashbinStore();
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const trashbinIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentcolor"><path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"/></svg>';

    const THROW_TEXT = "Place in Trashbin";
    const UNTHROW_TEXT = "Remove from Trashbin";

    const widget = new Spicetify.Playbar.Widget(
      THROW_TEXT,
      trashbinIcon,
      (self) => {
        const uri = Spicetify.Player.data.item.uri;
        const uriObj = Spicetify.URI.fromString(uri);
        const type = uriObj.type;

        if (!trashbinStore.trashSongList[uri]) {
          trashbinStore.addSongToTrash(uri);
        } else {
          trashbinStore.removeSongFromTrash(uri);
        }
      },
      false, // disabled
      false, // active
      false, // don't register immediately
    );

    widgetRef.current = widget;

    return () => {
      if (widgetRef.current) {
        widgetRef.current.deregister();
      }
    };
  }, []);

  // Update widget state based on current track and settings
  useEffect(() => {
    if (!widgetRef.current) return;

    const currentTrack = trashbinStore.currentTrack;
    if (!currentTrack) return;

    const uri = currentTrack.uri;
    const uriObj = Spicetify.URI.fromString(uri);
    const type = uriObj.type;
    const isBanned = trashbinStore.trashSongList[uri];

    // Hide widget for non-track types
    const hidden = type !== Spicetify.URI.Type.TRACK;

    if (hidden) {
      widgetRef.current.deregister();
    } else if (trashbinStore.widgetEnabled && trashbinStore.trashbinEnabled) {
      widgetRef.current.register();
    }

    // Update widget appearance
    widgetRef.current.active = !!isBanned;
    widgetRef.current.label = isBanned
      ? "Remove from Trashbin"
      : "Place in Trashbin";
  }, [
    trashbinStore.currentTrack,
    trashbinStore.trashSongList,
    trashbinStore.widgetEnabled,
    trashbinStore.trashbinEnabled,
  ]);

  // Handle widget registration based on settings
  useEffect(() => {
    if (!widgetRef.current) return;

    if (trashbinStore.widgetEnabled && trashbinStore.trashbinEnabled) {
      // Only register if current track is a track type
      const currentTrack = trashbinStore.currentTrack;
      if (currentTrack) {
        const uriObj = Spicetify.URI.fromString(currentTrack.uri);
        if (uriObj.type === Spicetify.URI.Type.TRACK) {
          widgetRef.current.register();
        }
      }
    } else {
      widgetRef.current.deregister();
    }
  }, [trashbinStore.widgetEnabled, trashbinStore.trashbinEnabled]);

  return null;
};
