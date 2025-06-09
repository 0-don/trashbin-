import React from "react";
import { useTrashButtonInjection } from "../hooks/use-trash-button-injection";

const QUEUELIST_CONFIG = {
  containerSelector: 'aside[aria-label="Queue"]',
  buttonSelector: ".trashbin-queue-btn",
  rowSelector: '[role="row"]',
  moreButtonSelector: 'button[aria-haspopup="menu"]',
  buttonClassName: "trashbin-queue-btn",
} as const;

export const TrashbinQueuelist: React.FC = () => {
  useTrashButtonInjection(QUEUELIST_CONFIG);
  return null;
};
