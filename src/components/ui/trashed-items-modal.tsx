import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsTrash3 } from "react-icons/bs";
import { SELECTORS } from "../../lib/constants";
import { TrashedItemsView } from "../views/trashed-items";

export function TrashedItemsModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const menuItem = new Spicetify.Menu.Item(
      t("ITEMS_TITLE"),
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
      title: t("ITEMS_TITLE"),
      content: (<TrashedItemsView />) as unknown as Element,
      isLarge: true,
    });

    const observer = new MutationObserver(() => {
      if (!document.querySelector(SELECTORS.TRACK_CREDITS_MODAL_CONTAINER)) {
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
