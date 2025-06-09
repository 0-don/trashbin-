import React from "react";
import { useTrashButtonInjection } from "../hooks/use-trash-button-injection";
import { useTrashbinStore } from "../store/trashbin-store";

const QUEUELIST_CONFIG = {
  containerSelector: "#Desktop_PanelContainer_Id",
  buttonSelector: ".trashbin-queue-btn",
  rowSelector: '[role="row"]',
  moreButtonSelector: 'button[aria-haspopup="menu"]',
  buttonClassName: "trashbin-queue-btn",
} as const;

export const TrashbinQueuelist: React.FC = () => {
  const queueTrashbinEnabled = useTrashbinStore(
    (state) => state.queueTrashbinEnabled,
  );

  useTrashButtonInjection(QUEUELIST_CONFIG, queueTrashbinEnabled);
  return null;
};
