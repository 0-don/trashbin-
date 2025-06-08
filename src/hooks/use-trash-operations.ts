import { useCallback } from "react";
import { MESSAGES } from "../lib/constants";
import { useTrashbinStore } from "../store/trashbin-store";

export const useTrashOperations = () => {
  const store = useTrashbinStore();

  const handleTrashToggle = useCallback(
    (uris: string[]) => {
      const uri = uris[0];
      const uriObj = Spicetify.URI.fromString(uri);

      if (uriObj.type === Spicetify.URI.Type.TRACK) {
        store.toggleSongTrash(uri);
      } else if (uriObj.type === Spicetify.URI.Type.ARTIST) {
        store.toggleArtistTrash(uri);
      }
    },
    [store],
  );

  const getTrashStatus = useCallback(
    (uri: string) => {
      return store.getTrashStatus(uri);
    },
    [store],
  );

  const shouldAddContextMenu = useCallback(
    (uris: string[]): boolean => {
      if (uris.length > 1 || !store.trashbinEnabled) return false;

      const { type } = getTrashStatus(uris[0]);
      return (
        type === Spicetify.URI.Type.TRACK || type === Spicetify.URI.Type.ARTIST
      );
    },
    [store.trashbinEnabled, getTrashStatus],
  );

  const getContextMenuLabel = useCallback(
    (uri: string): string => {
      const { isTrashed } = getTrashStatus(uri);
      return isTrashed ? MESSAGES.UNTHROW : MESSAGES.THROW;
    },
    [getTrashStatus],
  );

  return {
    handleTrashToggle,
    getTrashStatus,
    shouldAddContextMenu,
    getContextMenuLabel,
  };
};
