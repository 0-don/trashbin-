import React from "react";
import { useTrashButtonInjection } from "../hooks/use-trash-button-injection";

const TRACKLIST_CONFIG = {
  containerSelector: "main",
  buttonSelector: ".trashbin-tracklist-btn",
  rowSelector: ".main-trackList-trackListRow",
  moreButtonSelector: ".main-trackList-rowMoreButton",
  buttonClassName: "trashbin-tracklist-btn",
} as const;

export const TrashbinTracklist: React.FC = () => {
  useTrashButtonInjection(TRACKLIST_CONFIG);
  return null;
};
