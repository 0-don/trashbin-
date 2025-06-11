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
  <div className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-white/5">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {track.imageUrl ? (
        <img
          src={track.imageUrl}
          alt={track.name}
          className="h-12 w-12 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-white/10">
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
      className="group ml-2 flex-shrink-0 rounded-full p-2 transition-colors hover:bg-red-500/20 hover:text-red-400"
      title="Remove from trashbin"
    >
      <IoClose className="h-5 w-5 text-white/70 group-hover:text-red-400" />
    </button>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
  </div>
);

export const TrashedItemsView: React.FC<{ onBack?: () => void }> = () => {
  const { trashSongList, toggleSongTrash } = useTrashbinStore();
  const [tracks, setTracks] = useState<TrackDisplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  const trashedUris = useMemo(
    () => Object.keys(trashSongList),
    [trashSongList],
  );

  const virtualizer = useVirtualizer({
    count: trashedUris.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 10,
  });

  // Load initial tracks
  useEffect(() => {
    const loadInitialTracks = async () => {
      if (trashedUris.length === 0) {
        setTracks([]);
        setHasMore(false);
        return;
      }

      setLoading(true);
      try {
        const initialBatch = await fetchTracksMetadata(trashedUris, 0, 50);
        setTracks(initialBatch);
        setHasMore(initialBatch.length < trashedUris.length);
      } catch (error) {
        console.error("Failed to load tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialTracks();
  }, [trashedUris]);

  // Load more tracks when scrolling
  useEffect(() => {
    const loadMoreTracks = async () => {
      if (!hasMore || loading) return;

      const visibleRange = virtualizer.getVirtualItems();
      if (visibleRange.length === 0) return;

      const lastIndex = visibleRange[visibleRange.length - 1]?.index ?? 0;

      if (
        lastIndex >= tracks.length - 10 &&
        tracks.length < trashedUris.length
      ) {
        setLoading(true);
        try {
          const nextBatch = await fetchTracksMetadata(
            trashedUris,
            tracks.length,
            50,
          );
          setTracks((prev) => [...prev, ...nextBatch]);
          setHasMore(tracks.length + nextBatch.length < trashedUris.length);
        } catch (error) {
          console.error("Failed to load more tracks:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(loadMoreTracks, 100);
    return () => clearTimeout(timeoutId);
  }, [
    virtualizer.getVirtualItems(),
    tracks.length,
    trashedUris.length,
    loading,
    hasMore,
  ]);

  if (trashedUris.length === 0) {
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
    <div className="p-6">
      <div className="mb-6">
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
      </div>

      <div
        ref={parentRef}
        className="h-[500px] overflow-auto rounded-lg border border-white/10 bg-black/20"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const track = tracks[virtualItem.index];
            if (!track) {
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="flex items-center justify-center"
                >
                  <LoadingSpinner />
                </div>
              );
            }

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <TrackRow track={track} onUntrash={toggleSongTrash} />
              </div>
            );
          })}
        </div>

        {loading && tracks.length > 0 && (
          <div className="sticky bottom-0 border-t border-white/10 bg-black/50 backdrop-blur-sm">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {!hasMore && tracks.length > 0 && (
        <div className="py-4 text-center">
          <p className="text-sm text-white/40">
            All songs loaded ({tracks.length} total)
          </p>
        </div>
      )}
    </div>
  );
};
