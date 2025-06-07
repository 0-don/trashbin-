import React, { useEffect } from 'react';
import { useTrashbinStore } from '../store/trashbin-store';


export const TrashbinContextMenu: React.FC = () => {
  const { addToTrash, removeFromTrash, isInTrash, trashbinEnabled } = useTrashbinStore();

  useEffect(() => {
    const THROW_TEXT = "Add to Trashbin";
    const UNTHROW_TEXT = "Remove from Trashbin";
    const trashbinIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentcolor"><path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"/></svg>';

    const toggleThrow = (uris: string[]) => {
      const uri = uris[0];
      const uriObj = Spicetify.URI.fromString(uri);
      const type = uriObj.type;

      if (isInTrash(uri, type)) {
        removeFromTrash(uri, type);
      } else {
        addToTrash(uri, type);
      }
    };

    const shouldAddContextMenu = function(this: any, uris: string[]) {
      if (uris.length > 1 || !trashbinEnabled) {
        return false;
      }

      const uri = uris[0];
      const uriObj = Spicetify.URI.fromString(uri);
      
      if (uriObj.type === Spicetify.URI.Type.TRACK) {
        this.name = isInTrash(uri, uriObj.type) ? UNTHROW_TEXT : THROW_TEXT;
        return true;
      }

      if (uriObj.type === Spicetify.URI.Type.ARTIST) {
        this.name = isInTrash(uri, uriObj.type) ? UNTHROW_TEXT : THROW_TEXT;
        return true;
      }

      return false;
    };

    const contextMenuItem = new Spicetify.ContextMenu.Item(
      THROW_TEXT,
      toggleThrow,
      shouldAddContextMenu,
      trashbinIcon
    );
    
    contextMenuItem.register();

    return () => {
      contextMenuItem.deregister();
    };
  }, [addToTrash, removeFromTrash, isInTrash, trashbinEnabled]);

  return null; // This component doesn't render anything
};

