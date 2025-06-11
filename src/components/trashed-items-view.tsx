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
      <IoClose className="h-5 w-5 text-white/70" />
    </button>
  </div>
);

const EmptyState = () => (
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

export const TrashedItemsView: React.FC = () => {
  const { trashSongList, toggleSongTrash } = useTrashbinStore();
  const [trackCache, setTrackCache] = useState<Map<number, TrackDisplayData>>(
    new Map(),
  );
  const [loadingBatches, setLoadingBatches] = useState<Set<number>>(new Set());
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

  // Simplified batch loading
  const loadBatch = async (batchIndex: number) => {
    if (loadingBatches.has(batchIndex)) return;

    const BATCH_SIZE = 50;
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, trashedUris.length);

    setLoadingBatches((prev) => new Set(prev).add(batchIndex));

    try {
      const tracks = await fetchTracksMetadata(
        trashedUris.slice(startIndex, endIndex),
      );
      setTrackCache((prev) => {
        const newCache = new Map(prev);
        tracks.forEach((track, i) => newCache.set(startIndex + i, track));
        return newCache;
      });
    } catch (error) {
      console.error("Failed to load batch:", error);
    } finally {
      setLoadingBatches((prev) => {
        const newSet = new Set(prev);
        newSet.delete(batchIndex);
        return newSet;
      });
    }
  };

  // Load visible items
  useEffect(() => {
    const BATCH_SIZE = 50;
    const visibleItems = virtualizer.getVirtualItems();
    const batchesToLoad = new Set<number>();

    visibleItems.forEach((item) => {
      if (!trackCache.has(item.index)) {
        batchesToLoad.add(Math.floor(item.index / BATCH_SIZE));
      }
    });

    batchesToLoad.forEach(loadBatch);
  }, [virtualizer.getVirtualItems(), trackCache, trashedUris.length]);

  // Reset cache when trash list changes
  useEffect(() => {
    setTrackCache(new Map());
    setLoadingBatches(new Set());
  }, [trashedUris]);

  if (!trashedUris.length) return <EmptyState />;

  return (
    <>
      <style>{`.main-trackCreditsModal-mainSection {overflow-y: hidden !important;}`}</style>

      <div className="mb-2 flex items-center gap-3">
        <BsTrash3 className="h-6 w-6 text-white/70" />
        <h2 className="text-2xl font-bold text-white">
          {trashedUris.length} Trashed Song{trashedUris.length !== 1 ? "s" : ""}
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
                  <TrackRow
                    track={track}
                    onUntrash={(uri) => toggleSongTrash(uri, false)}
                  />
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
