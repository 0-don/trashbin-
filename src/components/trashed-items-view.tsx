import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type ItemData = TrackDisplayData | ArtistDisplayData;

interface ItemRowProps {
  item: ItemData;
  onUntrash: (uri: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onUntrash }) => {
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
        onClick={() => onUntrash(item.uri)}
        className="ml-2 rounded-full p-2 hover:bg-red-500/20 hover:text-red-400"
        title="Remove from trashbin"
      >
        <IoClose className="h-5 w-5 text-white/70" />
      </button>
    </div>
  );
};

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

export const TrashedItemsView: React.FC = () => {
  const { trashSongList, trashArtistList, toggleSongTrash, toggleArtistTrash } =
    useTrashbinStore();
  const [activeTab, setActiveTab] = useState<TabType>("songs");
  const [itemCache, setItemCache] = useState<
    Map<string, Map<number, ItemData>>
  >(
    new Map([
      ["songs", new Map()],
      ["artists", new Map()],
    ]),
  );
  const [loadingBatches, setLoadingBatches] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const trashedSongUris = useMemo(
    () => Object.keys(trashSongList),
    [trashSongList],
  );
  const trashedArtistUris = useMemo(
    () => Object.keys(trashArtistList),
    [trashArtistList],
  );

  const tabs = [
    {
      key: "songs" as const,
      label: "Songs",
      count: trashedSongUris.length,
      uris: trashedSongUris,
    },
    {
      key: "artists" as const,
      label: "Artists",
      count: trashedArtistUris.length,
      uris: trashedArtistUris,
    },
  ];

  const currentTab = tabs.find((tab) => tab.key === activeTab)!;
  const currentCache = itemCache.get(activeTab) || new Map();

  const virtualizer = useVirtualizer({
    count: currentTab.uris.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const loadBatch = useCallback(
    async (batchIndex: number) => {
      const batchKey = `${activeTab}-${batchIndex}`;
      if (loadingBatches.has(batchKey)) return;

      const BATCH_SIZE = 50;
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(
        startIndex + BATCH_SIZE,
        currentTab.uris.length,
      );

      setLoadingBatches((prev) => new Set(prev).add(batchKey));

      try {
        const urisSlice = currentTab.uris.slice(startIndex, endIndex);
        const data =
          activeTab === "songs"
            ? await fetchTracksMetadata(urisSlice)
            : await fetchArtistsMetadata(urisSlice);

        setItemCache((prev) => {
          const newCache = new Map(prev);
          const tabCache = new Map(newCache.get(activeTab));
          data.forEach((item, i) => tabCache.set(startIndex + i, item));
          newCache.set(activeTab, tabCache);
          return newCache;
        });
      } catch (error) {
        console.error(`Failed to load ${activeTab} batch:`, error);
      } finally {
        setLoadingBatches((prev) => {
          const newSet = new Set(prev);
          newSet.delete(batchKey);
          return newSet;
        });
      }
    },
    [activeTab, currentTab.uris, loadingBatches],
  );

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

    batchesToLoad.forEach(loadBatch);
  }, [virtualizer.getVirtualItems(), currentCache, loadBatch]);

  // Clear cache when tab changes or data changes
  useEffect(() => {
    setLoadingBatches(new Set());
  }, [activeTab]);

  useEffect(() => {
    setItemCache((prev) => {
      const newCache = new Map(prev);
      newCache.set("songs", new Map());
      return newCache;
    });
  }, [trashedSongUris]);

  useEffect(() => {
    setItemCache((prev) => {
      const newCache = new Map(prev);
      newCache.set("artists", new Map());
      return newCache;
    });
  }, [trashedArtistUris]);

  const handleUntrash = useCallback(
    (uri: string) => {
      if (activeTab === "songs") {
        toggleSongTrash(uri, false);
      } else {
        toggleArtistTrash(uri, false);
      }
    },
    [activeTab, toggleSongTrash, toggleArtistTrash],
  );

  const hasItems = trashedSongUris.length > 0 || trashedArtistUris.length > 0;

  if (!hasItems) return <EmptyState type={activeTab} />;

  return (
    <>
      <style>{`.main-trackCreditsModal-mainSection {overflow-y: hidden !important;}`}</style>

      {/* Tab Navigation */}
      <div className="!mb-4 flex border-b border-white/10">
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            count={tab.count}
            isActive={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {currentTab.uris.length === 0 ? (
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
                      <ItemRow item={data} onUntrash={handleUntrash} />
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

          <div className="!py-4 text-center">
            <p className="text-sm text-white/40">
              {currentCache.size} of {currentTab.uris.length} {activeTab} loaded
            </p>
          </div>
        </>
      )}
    </>
  );
};
