import React from "react";
import { useTrashButtonInjection } from "../hooks/use-trash-button-injection";
import { useTrashbinStore } from "../store/trashbin-store";

const TRACKLIST_CONFIG = {
  containerSelector: "main",
  buttonSelector: ".trashbin-tracklist-btn",
  rowSelector: ".main-trackList-trackListRow",
  moreButtonSelector: ".main-trackList-rowMoreButton",
  buttonClassName: "trashbin-tracklist-btn",
} as const;

export const TrashbinTracklist: React.FC = () => {
  const tracklistTrashbinEnabled = useTrashbinStore(
    (state) => state.tracklistTrashbinEnabled,
  );

  useTrashButtonInjection(TRACKLIST_CONFIG, tracklistTrashbinEnabled);
  return null;
};
