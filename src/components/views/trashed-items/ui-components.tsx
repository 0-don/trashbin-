import React from "react";
import { useTranslation } from "react-i18next";
import { BsMusicNote, BsPerson, BsTrash3 } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import {
  ArtistDisplayData,
  ItemData,
  TabType,
  TrackDisplayData,
} from "../../../lib/types";
import { cn } from "../../../lib/utils";

interface ItemRowProps {
  item: ItemData;
  onUntrash: (uri: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({ item, onUntrash }) => {
  const isArtist = "type" in item && item.type === "artist";
  const imageClass = isArtist ? "rounded-full" : "rounded";
  const Icon = isArtist ? BsPerson : BsMusicNote;
  const secondaryText = isArtist
    ? (item as ArtistDisplayData).secondaryText
    : (item as TrackDisplayData).artist;

  return (
    <div className="flex items-center justify-between rounded-md p-3 hover:bg-white/5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`h-12 w-12 ${imageClass} object-cover`}
          />
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center ${imageClass} bg-white/10`}
          >
            <Icon className="h-6 w-6 text-white/70" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-white">{item.name}</div>
          <div className="truncate text-sm text-white/60">{secondaryText}</div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onUntrash(item.uri);
        }}
        className="!mx-2 rounded-full p-2 hover:bg-red-500/20 hover:text-red-400"
        title="Remove from trashbin"
      >
        <IoClose className="h-5 w-5 text-white/70" />
      </button>
    </div>
  );
};

interface EmptyStateProps {
  type: TabType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const { t } = useTranslation();

  return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center gap-6 py-12">
        <BsTrash3 className="h-20 w-20 text-white/20" />
        <div>
          <h3 className="mb-2 text-xl font-semibold text-white">
            {type === "songs"
              ? t("ITEMS_EMPTY_SONGS_TITLE")
              : t("ITEMS_EMPTY_ARTISTS_TITLE")}
          </h3>
          <p
            className="text-white/60"
            dangerouslySetInnerHTML={{
              __html:
                type === "songs"
                  ? t("ITEMS_EMPTY_SONGS")
                  : t("ITEMS_EMPTY_ARTISTS"),
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  label,
  count,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative !px-4 !py-2 text-lg font-medium transition-colors",
      "border-b-2 border-transparent",
      isActive
        ? "!border-green-500 !text-white"
        : "text-white/60 hover:text-white/80",
    )}
  >
    {label}
    <span className="!mx-1 text-xs text-white/60">({count})</span>
    {isActive && (
      <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-green-500" />
    )}
  </button>
);
