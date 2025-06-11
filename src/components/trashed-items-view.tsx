import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsMusicNote, BsPerson, BsTrash3 } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import {
  TrackDisplayData,
  fetchArtistsMetadata,
  fetchTracksMetadata,
} from "../lib/metadata-utils";
import { cn } from "../lib/utils";
import { useTrashbinStore } from "../store/trashbin-store";

type TabType = "songs" | "artists";

interface ArtistDisplayData {
  uri: string;
  name: string;
  type: "artist";
  imageUrl?: string;
  secondaryText: string;
}

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

const ArtistRow: React.FC<{
  artist: ArtistDisplayData;
  onUntrash: (uri: string) => void;
}> = ({ artist, onUntrash }) => (
  <div className="flex items-center justify-between rounded-md p-3 hover:bg-white/5">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {artist.imageUrl ? (
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <BsPerson className="h-6 w-6 text-white/70" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-white">{artist.name}</div>
        <div className="truncate text-sm text-white/60">
          {artist.secondaryText}
        </div>
      </div>
    </div>
    <button
      onClick={() => onUntrash(artist.uri)}
      className="ml-2 rounded-full p-2 hover:bg-red-500/20 hover:text-red-400"
      title="Remove from trashbin"
    >
      <IoClose className="h-5 w-5 text-white/70" />
    </button>
  </div>
);

const EmptyState: React.FC<{ type: TabType }> = ({ type }) => (
  <div className="p-8 text-center">
    <div className="flex flex-col items-center gap-6 py-12">
      <BsTrash3 className="h-20 w-20 text-white/20" />
      <div>
        <h3 className="mb-2 text-xl font-semibold text-white">
          No trashed {type}!
        </h3>
        <p className="text-white/60">
          {type === "songs" ? "Songs" : "Artists"} you add to the trashbin will
          appear here.
        </p>
      </div>
    </div>
  </div>
);

const TabButton: React.FC<{
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative px-4 py-2 text-sm font-medium transition-colors",
      "border-b-2 border-transparent",
      isActive
        ? "border-green-500 text-white"
        : "text-white/60 hover:text-white/80",
    )}
  >
    {label}
    {count > 0 && <span className="ml-1 text-xs text-white/60">({count})</span>}
    {isActive && (
      <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-green-500" />
    )}
  </button>
);

export const TrashedItemsView: React.FC = () => {
  const { trashSongList, trashArtistList, toggleSongTrash, toggleArtistTrash } =
    useTrashbinStore();
  const [activeTab, setActiveTab] = useState<TabType>("songs");
  const [trackCache, setTrackCache] = useState<Map<number, TrackDisplayData>>(
    new Map(),
  );
  const [artistCache, setArtistCache] = useState<
    Map<number, ArtistDisplayData>
  >(new Map());
  const [loadingBatches, setLoadingBatches] = useState<Set<number>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const trashedSongUris = useMemo(
    () => Object.keys(trashSongList),
    [trashSongList],
  );
  const trashedArtistUris = useMemo(
    () => Object.keys(trashArtistList),
    [trashArtistList],
  );

  const currentItems =
    activeTab === "songs" ? trashedSongUris : trashedArtistUris;
  const currentCache = activeTab === "songs" ? trackCache : artistCache;

  const virtualizer = useVirtualizer({
    count: currentItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  // Load batch function for songs
  const loadSongBatch = async (batchIndex: number) => {
    if (loadingBatches.has(batchIndex) || activeTab !== "songs") return;

    const BATCH_SIZE = 50;
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, trashedSongUris.length);

    setLoadingBatches((prev) => new Set(prev).add(batchIndex));

    try {
      const tracks = await fetchTracksMetadata(
        trashedSongUris.slice(startIndex, endIndex),
      );
      setTrackCache((prev) => {
        const newCache = new Map(prev);
        tracks.forEach((track, i) => newCache.set(startIndex + i, track));
        return newCache;
      });
    } catch (error) {
      console.error("Failed to load song batch:", error);
    } finally {
      setLoadingBatches((prev) => {
        const newSet = new Set(prev);
        newSet.delete(batchIndex);
        return newSet;
      });
    }
  };

  // Load batch function for artists
  const loadArtistBatch = async (batchIndex: number) => {
    if (loadingBatches.has(batchIndex) || activeTab !== "artists") return;

    const BATCH_SIZE = 50;
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(
      startIndex + BATCH_SIZE,
      trashedArtistUris.length,
    );

    setLoadingBatches((prev) => new Set(prev).add(batchIndex));

    try {
      const artists = await fetchArtistsMetadata(
        trashedArtistUris.slice(startIndex, endIndex),
      );
      setArtistCache((prev) => {
        const newCache = new Map(prev);
        artists.forEach((artist, i) => newCache.set(startIndex + i, artist));
        return newCache;
      });
    } catch (error) {
      console.error("Failed to load artist batch:", error);
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
      if (!currentCache.has(item.index)) {
        batchesToLoad.add(Math.floor(item.index / BATCH_SIZE));
      }
    });

    if (activeTab === "songs") {
      batchesToLoad.forEach(loadSongBatch);
    } else {
      batchesToLoad.forEach(loadArtistBatch);
    }
  }, [
    virtualizer.getVirtualItems(),
    currentCache,
    currentItems.length,
    activeTab,
  ]);

  // Reset cache when switching tabs
  useEffect(() => {
    setLoadingBatches(new Set());
  }, [activeTab]);

  // Reset caches when trash lists change
  useEffect(() => {
    setTrackCache(new Map());
  }, [trashedSongUris]);

  useEffect(() => {
    setArtistCache(new Map());
  }, [trashedArtistUris]);

  const hasItems = trashedSongUris.length > 0 || trashedArtistUris.length > 0;

  if (!hasItems) return <EmptyState type={activeTab} />;

  return (
    <>
      <style>{`.main-trackCreditsModal-mainSection {overflow-y: hidden !important;}`}</style>

      <div className="mb-4 flex items-center gap-3">
        <BsTrash3 className="h-6 w-6 text-white/70" />
        <h2 className="text-2xl font-bold text-white">Trashbin+ Items</h2>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 flex border-b border-white/10">
        <TabButton
          label="Songs"
          count={trashedSongUris.length}
          isActive={activeTab === "songs"}
          onClick={() => setActiveTab("songs")}
        />
        <TabButton
          label="Artists"
          count={trashedArtistUris.length}
          isActive={activeTab === "artists"}
          onClick={() => setActiveTab("artists")}
        />
      </div>

      <p className="mb-4 text-white/60">
        Click the × button to remove {activeTab} from your trashbin.
      </p>

      {currentItems.length === 0 ? (
        <EmptyState type={activeTab} />
      ) : (
        <>
          <div
            ref={parentRef}
            className="h-[400px] overflow-auto rounded-lg border border-white/10 bg-black/20"
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((item) => {
                const data = currentCache.get(item.index);
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
                    {data ? (
                      activeTab === "songs" ? (
                        <TrackRow
                          track={data as TrackDisplayData}
                          onUntrash={(uri) => toggleSongTrash(uri, false)}
                        />
                      ) : (
                        <ArtistRow
                          artist={data as ArtistDisplayData}
                          onUntrash={(uri) => toggleArtistTrash(uri, false)}
                        />
                      )
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
              {currentCache.size} of {currentItems.length} {activeTab} loaded
            </p>
          </div>
        </>
      )}
    </>
  );
};
