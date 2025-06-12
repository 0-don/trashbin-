import { useTranslation } from "react-i18next";
import { useTrashbinStore } from "../store/trashbin-store";

export const useTrashOperations = () => {
  const { t } = useTranslation();
  const store = useTrashbinStore();

  const handleTrashToggle = (uris: string[]) => {
    const uri = uris[0];
    const uriObj = Spicetify.URI.fromString(uri);

    if (uriObj.type === Spicetify.URI.Type.TRACK) {
      store.toggleSongTrash(uri);
    } else if (uriObj.type === Spicetify.URI.Type.ARTIST) {
      store.toggleArtistTrash(uri);
    }
  };

  const shouldAddContextMenu = (uris: string[]): boolean => {
    if (uris.length > 1 || !store.trashbinEnabled) return false;

    const { type } = store.getTrashStatus(uris[0]);
    return (
      type === Spicetify.URI.Type.TRACK || type === Spicetify.URI.Type.ARTIST
    );
  };

  const getContextMenuLabel = (uri: string): string => {
    const { isTrashed } = store.getTrashStatus(uri);
    return isTrashed ? t("ACTION_UNTHROW") : t("ACTION_THROW");
  };

  return {
    handleTrashToggle,
    shouldAddContextMenu,
    getContextMenuLabel,
  };
};
