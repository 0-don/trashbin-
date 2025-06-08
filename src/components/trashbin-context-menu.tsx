import { useEffect, useRef } from "react";
import { useTrashOperations } from "../hooks/use-trash-operations";
import { MESSAGES } from "../lib/constants";
import { TRASH_ICON } from "./icons";

export function TrashbinContextMenu() {
  const { handleTrashToggle, shouldAddContextMenu, getContextMenuLabel } =
    useTrashOperations();
  const contextMenuItemRef = useRef<{ name: string } | null>(null);

  const shouldAddContextMenuWithUpdate = (uris: string[]): boolean => {
    const shouldAdd = shouldAddContextMenu(uris);

    if (shouldAdd && contextMenuItemRef.current) {
      contextMenuItemRef.current.name = getContextMenuLabel(uris[0]);
    }

    return shouldAdd;
  };

  useEffect(() => {
    const contextMenuItem = new Spicetify.ContextMenu.Item(
      MESSAGES.THROW,
      handleTrashToggle,
      shouldAddContextMenuWithUpdate,
      TRASH_ICON(15),
    );

    contextMenuItemRef.current = contextMenuItem;
    contextMenuItem.register();

    return () => contextMenuItem.deregister();
  }, [handleTrashToggle, shouldAddContextMenuWithUpdate]);

  return null;
}
