import { useEffect } from "react";
import { useTrashbinStore } from "../store/trashbin-store";
import { TRASH_ICON } from "../lib/icons";

export function TrashbinContextMenu() {
  const trashbinStore = useTrashbinStore();

  const toggleThrow = (uris: string[]) => {
    const uri = uris[0];
    const uriObj = Spicetify.URI.fromString(uri);
    const type = uriObj.type;

    if (type === Spicetify.URI.Type.TRACK) {
      if (trashbinStore.trashSongList[uri]) {
        trashbinStore.removeSongFromTrash(uri);
      } else {
        trashbinStore.addSongToTrash(uri);
      }
    } else if (type === Spicetify.URI.Type.ARTIST) {
      if (trashbinStore.trashArtistList[uri]) {
        trashbinStore.removeArtistFromTrash(uri);
      } else {
        trashbinStore.addArtistToTrash(uri);
      }
    }
  };

  const shouldAddContextMenu = (uris: string[]): boolean => {
    if (uris.length > 1 || !trashbinStore.trashbinEnabled) {
      return false;
    }

    const uri = uris[0];
    const uriObj = Spicetify.URI.fromString(uri);

    return (
      uriObj.type === Spicetify.URI.Type.TRACK ||
      uriObj.type === Spicetify.URI.Type.ARTIST
    );
  };

  useEffect(() => {
    const contextMenuItem = new Spicetify.ContextMenu.Item(
      "Place in Trashbin",
      toggleThrow,
      shouldAddContextMenu,
      TRASH_ICON,
    );

    contextMenuItem.register();

    return () => {
      contextMenuItem.deregister();
    };
  }, [trashbinStore.trashbinEnabled]);

  return null;
}
