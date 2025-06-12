import React from "react";
import { useTrashButtonInjection } from "../../../hooks/use-trash-button-injection";
import { useTrashbinStore } from "../../../store/trashbin-store";
import { TRACKLIST_CONFIG } from "../../../lib/constants";

export const TrashbinTracklist: React.FC = () => {
  const tracklistTrashbinEnabled = useTrashbinStore(
    (state) => state.tracklistTrashbinEnabled,
  );

  useTrashButtonInjection(TRACKLIST_CONFIG, tracklistTrashbinEnabled);
  return null;
};
