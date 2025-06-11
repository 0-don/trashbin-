import React, { useEffect, useState } from "react";
import { BsTrash3 } from "react-icons/bs";
import { UI_TEXT } from "../lib/constants";
import { TrashedItemsView } from "./trashed-items-view";

export function TrashedItemsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const menuItem = new Spicetify.Menu.Item(
      UI_TEXT.TRASHBIN_ITEMS,
      false,
      () => setIsOpen(true),
      Spicetify.ReactDOMServer.renderToString(<BsTrash3 size={15} />),
    );
    menuItem.register();
    return () => menuItem.deregister();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    Spicetify.PopupModal.display({
      title: UI_TEXT.TRASHBIN_ITEMS,
      content: (<TrashedItemsView />) as unknown as Element,
      isLarge: true,
    });

    // Detect when modal closes
    const observer = new MutationObserver(() => {
      if (!document.querySelector(".main-trackCreditsModal-container")) {
        setIsOpen(false);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  return null;
}
