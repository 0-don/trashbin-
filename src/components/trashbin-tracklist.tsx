import React from "react";
import { useTrashButtonInjection } from "../hooks/use-trash-button-injection";

const TRACKLIST_CONFIG = {
  containerSelector: "main",
  buttonSelector: ".trashbin-btn",
  rowSelector: ".main-trackList-trackListRow",
  moreButtonSelector: ".main-trackList-rowMoreButton",
  buttonClassName: "trashbin-btn",
};

export const TrashbinTracklist: React.FC = () => {
  useTrashButtonInjection(TRACKLIST_CONFIG);
  return null;
};
