import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsMusicNote, BsTrash3 } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { TrackDisplayData, fetchTracksMetadata } from "../lib/metadata-utils";
import { useTrashbinStore } from "../store/trashbin-store";

const TrackRow: React.FC<{
  track: TrackDisplayData;
  onUntrash: (uri: string) => void;
}> = ({ track, onUntrash }) => (
  <div className="flex items-center justify-between rounded-md p-3 hover:bg-white/5">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {track.imageUrl ? (
        <img
          src={track.imageUrl}
          alt={track.name}
          className="h-12 w-12 rounded object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10">
          <BsMusicNote className="h-6 w-6 text-white/70" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-white">{track.name}</div>
        <div className="truncate text-sm text-white/60">{track.artist}</div>
      </div>
    </div>
    <button
      onClick={() => onUntrash(track.uri)}
      className="ml-2 rounded-full p-2 hover:bg-red-500/20 hover:text-red-400"
      title="Remove from trashbin"
    >
      <IoClose className="h-5 w-5 text-white/70 group-hover:text-red-400" />
    </button>
  </div>
);

export const TrashedItemsView: React.FC = () => {
  const { trashSongList, toggleSongTrash } = useTrashbinStore();
  const [trackCache, setTrackCache] = useState<Map<number, TrackDisplayData>>(
    new Map(),
  );
  const [loadingRanges, setLoadingRanges] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const trashedUris = useMemo(
    () => Object.keys(trashSongList),
    [trashSongList],
  );

  const virtualizer = useVirtualizer({
    count: trashedUris.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const loadBatch = async (startIndex: number, endIndex: number) => {
    const batchKey = `${startIndex}-${endIndex}`;
    if (loadingRanges.has(batchKey)) return;

    setLoadingRanges((prev) => new Set(prev).add(batchKey));

    try {
      const tracks = await fetchTracksMetadata(
        trashedUris.slice(startIndex, endIndex + 1),
      );
      setTrackCache((prev) => {
        const newCache = new Map(prev);
        tracks.forEach((track, i) => newCache.set(startIndex + i, track));
        return newCache;
      });
    } catch (error) {
      console.error("Failed to load batch:", error);
    } finally {
      setLoadingRanges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(batchKey);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    if (!items.length || !trashedUris.length) return;

    const batchSize = 50;
    const batches = new Set<string>();

    items.forEach((item) => {
      if (!trackCache.has(item.index)) {
        const start = Math.floor(item.index / batchSize) * batchSize;
        const end = Math.min(start + batchSize - 1, trashedUris.length - 1);
        batches.add(`${start}-${end}`);
      }
    });

    batches.forEach((batchKey) => {
      const [start, end] = batchKey.split("-").map(Number);
      loadBatch(start, end);
    });
  }, [
    virtualizer.getVirtualItems(),
    trackCache,
    trashedUris.length,
    loadingRanges,
  ]);

  useEffect(() => {
    setTrackCache(new Map());
    setLoadingRanges(new Set());
  }, [trashedUris]);

  if (!trashedUris.length) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center gap-6 py-12">
          <BsTrash3 className="h-20 w-20 text-white/20" />
          <div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No trashed songs!
            </h3>
            <p className="text-white/60">
              Songs you add to the trashbin will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`.main-trackCreditsModal-mainSection {overflow-y: hidden !important;}`}
      </style>

      <div className="mb-2 flex items-center gap-3">
        <BsTrash3 className="h-6 w-6 text-white/70" />
        <h2 className="text-2xl font-bold text-white">
          {trashedUris.length} Trashed Song
          {trashedUris.length !== 1 ? "s" : ""}
        </h2>
      </div>
      <p className="text-white/60">
        Click the × button to remove songs from your trashbin.
      </p>

      <div
        ref={parentRef}
        className="h-[450px] overflow-auto rounded-lg border border-white/10 bg-black/20"
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const track = trackCache.get(item.index);
            return (
              <div
                key={item.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                {track ? (
                  <TrackRow track={track} onUntrash={toggleSongTrash} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="py-4 text-center">
        <p className="text-sm text-white/40">
          {trackCache.size} of {trashedUris.length} songs loaded
        </p>
      </div>
    </>
  );
};
