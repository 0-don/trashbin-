import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchArtistsMetadata,
  fetchTracksMetadata,
} from "../../../lib/metadata-utils";
import { ItemData, TabType } from "../../../lib/types";
import { ItemRow } from "./ui-components";

interface VirtualListProps {
  items: string[];
  activeTab: TabType;
  onUntrash: (uri: string) => void;
}

export const VirtualList: React.FC<VirtualListProps> = ({
  items,
  activeTab,
  onUntrash,
}) => {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const [itemCache, setItemCache] = useState<Map<number, ItemData>>(new Map());
  const [loadingBatches, setLoadingBatches] = useState<Set<string>>(new Set());

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const loadBatch = async (batchIndex: number) => {
    const batchKey = `${activeTab}-${batchIndex}`;
    if (loadingBatches.has(batchKey)) return;

    const BATCH_SIZE = 50;
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, items.length);

    setLoadingBatches((prev) => new Set(prev).add(batchKey));

    try {
      const urisSlice = items.slice(startIndex, endIndex);
      const data =
        activeTab === "songs"
          ? await fetchTracksMetadata(urisSlice)
          : await fetchArtistsMetadata(urisSlice);

      setItemCache((prev) => {
        const newCache = new Map(prev);
        data.forEach((item, i) => newCache.set(startIndex + i, item));
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
  };

  useEffect(() => {
    const BATCH_SIZE = 50;
    const visibleItems = virtualizer.getVirtualItems();
    const batchesToLoad = new Set<number>();

    visibleItems.forEach((item) => {
      if (!itemCache.has(item.index)) {
        batchesToLoad.add(Math.floor(item.index / BATCH_SIZE));
      }
    });

    batchesToLoad.forEach(loadBatch);
  }, [virtualizer.getVirtualItems(), itemCache, loadBatch]);

  // Clear cache when tab or items change
  useEffect(() => {
    setItemCache(new Map());
    setLoadingBatches(new Set());
  }, [activeTab, items]);

  return (
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
            const data = itemCache.get(item.index);
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
                  <ItemRow item={data} onUntrash={onUntrash} />
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
          {t("ITEMS_LOADED_COUNT", {
            loaded: itemCache.size,
            total: items.length,
            type: activeTab,
          })}
        </p>
      </div>
    </>
  );
};
