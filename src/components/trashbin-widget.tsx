import React from "react";
import { LuTrash, LuTrash2 } from "react-icons/lu";
import { cn } from "../lib/utils";
import { useTrashbinStore } from "../store/trashbin-store";

export const TrashbinWidget: React.FC = () => {
  const {
    addToTrash,
    removeFromTrash,
    isInTrash,
    trashbinEnabled,
    widgetEnabled,
    currentTrack,
  } = useTrashbinStore();

  if (!trashbinEnabled || !widgetEnabled || !currentTrack) {
    return null;
  }

  const uri = currentTrack.uri;
  const uriObj = Spicetify.URI.fromString(uri);
  const type = uriObj.type;
  const isTrashItem = isInTrash(uri, type);

  const handleTrashToggle = () => {
    if (isTrashItem) {
      removeFromTrash(uri, type);
    } else {
      addToTrash(uri, type);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 pointer-events-auto z-50">
      <button
        onClick={handleTrashToggle}
        className={cn(
          "p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900",
          isTrashItem
            ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
            : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-gray-500"
        )}
        title={isTrashItem ? "Remove from trashbin" : "Add to trashbin"}
        aria-label={isTrashItem ? "Remove from trashbin" : "Add to trashbin"}
      >
        {isTrashItem ? <LuTrash size={20} /> : <LuTrash2 size={20} />}
      </button>
    </div>
  );
};

