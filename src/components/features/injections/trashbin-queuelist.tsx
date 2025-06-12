import React from "react";
import { useTrashButtonInjection } from "../../../hooks/use-trash-button-injection";
import { useTrashbinStore } from "../../../store/trashbin-store";
import { QUEUELIST_CONFIG } from "../../../lib/constants";

export const TrashbinQueuelist: React.FC = () => {
  const queueTrashbinEnabled = useTrashbinStore(
    (state) => state.queueTrashbinEnabled,
  );

  useTrashButtonInjection(QUEUELIST_CONFIG, queueTrashbinEnabled);
  return null;
};
