import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SELECTORS } from "../../../lib/constants";
import { TabType } from "../../../lib/types";
import { useTrashbinStore } from "../../../store/trashbin-store";
import { EmptyState, TabButton } from "./ui-components";
import { VirtualList } from "./virtual-list";

export const TrashedItemsView: React.FC = () => {
  const { t } = useTranslation();
  const store = useTrashbinStore();
  const [activeTab, setActiveTab] = useState<TabType>("songs");

  const trashedSongUris = useMemo(
    () => Object.keys(store.trashSongList),
    [store.trashSongList],
  );
  const trashedArtistUris = useMemo(
    () => Object.keys(store.trashArtistList),
    [store.trashArtistList],
  );

  const tabs = [
    {
      key: "songs" as const,
      label: t("ITEMS_TAB_SONGS"),
      count: trashedSongUris.length,
      uris: trashedSongUris,
    },
    {
      key: "artists" as const,
      label: t("ITEMS_TAB_ARTISTS"),
      count: trashedArtistUris.length,
      uris: trashedArtistUris,
    },
  ];

  const currentTab = tabs.find((tab) => tab.key === activeTab)!;

  const handleUntrash = (uri: string) => {
    if (activeTab === "songs") {
      store.toggleSongTrash(uri, false);
    } else {
      store.toggleArtistTrash(uri, false);
    }
  };

  const hasItems = trashedSongUris.length > 0 || trashedArtistUris.length > 0;

  if (!hasItems) return <EmptyState type={activeTab} />;

  return (
    <>
      <style>{`${SELECTORS.TRACK_CREDITS_MODAL} {overflow-y: hidden !important;}`}</style>

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
        <VirtualList
          items={currentTab.uris}
          activeTab={activeTab}
          onUntrash={handleUntrash}
        />
      )}
    </>
  );
};
