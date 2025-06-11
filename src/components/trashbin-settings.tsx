import React, { useEffect, useState } from "react";
import { MESSAGES, UI_TEXT } from "../lib/constants";
import { cn } from "../lib/utils";
import { useTrashbinStore } from "../store/trashbin-store";
import { TRASH_ICON } from "./icons";

const Toggle: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => (
  <div className="flex items-center justify-between !gap-2.5 !py-2.5">
    <label className="w-full pr-4">{label}</label>
    <div className="text-right">
      <button
        className={cn(
          "!flex !cursor-pointer !items-center !rounded-full !border-0",
          "!ml-3 !p-2 !transition-colors",
          "!bg-[rgba(var(--spice-rgb-shadow),0.7)] !text-[var(--spice-text)]",
          !enabled && "!text-[rgba(var(--spice-rgb-text),0.3)]",
        )}
        onClick={() => onChange(!enabled)}
      >
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.797 2.5a.5.5 0 0 0-.594 0L2.5 6.5v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7l-5.703-4z" />
        </svg>
      </button>
    </div>
  </div>
);

const ActionButton: React.FC<{
  label: string;
  description: string;
  onClick: () => void;
}> = ({ label, description, onClick }) => (
  <div className="flex items-center justify-between !gap-2.5 !py-2.5">
    <label className="w-full pr-4">{description}</label>
    <div className="text-right">
      <button
        className={cn(
          "!rounded-full !bg-transparent !font-bold !transition-transform",
          "!border !border-[#727272] !px-[15px] !duration-[33ms]",
          "!min-h-8 !cursor-pointer !text-[var(--spice-text)]",
          "hover:!scale-[1.04] hover:!border-[var(--spice-text)]",
        )}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  </div>
);

const SettingsModal: React.FC = () => {
  const store = useTrashbinStore();

  const handleFileImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          store.importTrashData(data.songs || {}, data.artists || {});
          Spicetify.showNotification(MESSAGES.BACKUP_RESTORED_SUCCESS);
        } catch {
          Spicetify.showNotification(MESSAGES.BACKUP_RESTORED_FAILED, true);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      const handle = await window.showSaveFilePicker?.({
        suggestedName: UI_TEXT.SUGGESTED_NAME,
        types: [{ accept: { "application/json": [".json"] } }],
      });
      const writable = await handle?.createWritable();
      await writable?.write(JSON.stringify(store.exportData()));
      await writable?.close();
      Spicetify.showNotification(MESSAGES.BACKUP_SAVED_SUCCESS);
    } catch {
      Spicetify.showNotification(MESSAGES.BACKUP_SAVED_FAILED);
    }
  };

  const handleCopy = () => {
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(store.exportData()));
    Spicetify.showNotification(MESSAGES.COPIED);
  };

  const handleClear = () => {
    store.clearTrashbin();
    Spicetify.showNotification(MESSAGES.TRASHBIN_CLEARED);
  };

  return (
    <div className="p-4">
      <h2 className="!my-2.5 text-lg font-bold text-[var(--spice-text)] first-of-type:mt-0">
        {UI_TEXT.OPTIONS}
      </h2>
      <Toggle
        label={UI_TEXT.ENABLED}
        enabled={store.trashbinEnabled}
        onChange={store.setTrashbinEnabled}
      />
      <Toggle
        label={UI_TEXT.SHOW_WIDGET_ICON}
        enabled={store.widgetEnabled}
        onChange={store.setWidgetEnabled}
      />

      <h2 className="!my-2.5 text-lg font-bold text-[var(--spice-text)] first-of-type:mt-0">
        {UI_TEXT.FEATURES}
      </h2>
      <Toggle
        label={UI_TEXT.AUTOPLAY_ON_START}
        enabled={store.autoplayOnStart}
        onChange={store.setAutoplayOnStart}
      />
      <Toggle
        label={UI_TEXT.QUEUE_TRASHBIN}
        enabled={store.queueTrashbinEnabled}
        onChange={store.setQueueTrashbinEnabled}
      />
      <Toggle
        label={UI_TEXT.TRACKLIST_TRASHBIN}
        enabled={store.tracklistTrashbinEnabled}
        onChange={store.setTracklistTrashbinEnabled}
      />
      <Toggle
        label={UI_TEXT.RESHUFFLE_ON_SKIP}
        enabled={store.reshuffleOnSkip}
        onChange={store.setReshuffleOnSkip}
      />

      <h2 className="!my-2.5 text-lg font-bold text-[var(--spice-text)] first-of-type:mt-0">
        {UI_TEXT.LOCAL_STORAGE}
      </h2>
      <ActionButton
        label={UI_TEXT.COPY}
        description={UI_TEXT.COPY_DESCRIPTION}
        onClick={handleCopy}
      />
      <ActionButton
        label={UI_TEXT.EXPORT}
        description={UI_TEXT.EXPORT_DESCRIPTION}
        onClick={handleExport}
      />
      <ActionButton
        label={UI_TEXT.IMPORT}
        description={UI_TEXT.IMPORT_DESCRIPTION}
        onClick={handleFileImport}
      />
      <ActionButton
        label={UI_TEXT.CLEAR}
        description={UI_TEXT.CLEAR_DESCRIPTION}
        onClick={handleClear}
      />
    </div>
  );
};

export function TrashbinSettings() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const menuItem = new Spicetify.Menu.Item(
      UI_TEXT.TRASHBIN,
      false,
      () => setIsOpen(true),
      TRASH_ICON(15),
    );
    menuItem.register();
    return () => menuItem.deregister();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    Spicetify.PopupModal.display({
      title: UI_TEXT.SETTINGS,
      content: (<SettingsModal />) as unknown as Element,
    });

    // Detect when modal closes
    const observer = new MutationObserver(() => {
      if (!document.querySelector(".main-trackCreditsModal-container")) {
        setIsOpen(false);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  return null;
}
