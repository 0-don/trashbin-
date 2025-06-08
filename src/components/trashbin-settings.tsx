import React, { FC, ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  FiCheck,
  FiCopy,
  FiDownload,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { cn } from "../lib/utils";
import { useTrashbinStore } from "../store/trashbin-store";

interface ToggleButtonProps {
  enabled: boolean;
  onClick: () => void;
}

const ToggleButton: FC<ToggleButtonProps> = ({ enabled, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
    )}
    style={{
      border: "none",
      cursor: "pointer",
      backgroundColor: enabled ? "#1db954" : "#535353",
      color: enabled ? "white" : "#b3b3b3",
    }}
  >
    <FiCheck size={16} />
  </button>
);

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: "default" | "danger";
}

const ActionButton: FC<ActionButtonProps> = ({
  onClick,
  children,
  variant = "default",
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-105",
    )}
    style={{
      cursor: "pointer",
      backgroundColor: "transparent",
      border: variant === "danger" ? "1px solid #e22134" : "1px solid #727272",
      color: variant === "danger" ? "#e22134" : "#b3b3b3",
    }}
    onMouseEnter={(e) => {
      const btn = e.target as HTMLElement;
      if (variant === "danger") {
        btn.style.backgroundColor = "#e22134";
        btn.style.color = "white";
      } else {
        btn.style.borderColor = "white";
        btn.style.color = "white";
      }
    }}
    onMouseLeave={(e) => {
      const btn = e.target as HTMLElement;
      btn.style.backgroundColor = "transparent";
      btn.style.borderColor = variant === "danger" ? "#e22134" : "#727272";
      btn.style.color = variant === "danger" ? "#e22134" : "#b3b3b3";
    }}
  >
    {children}
  </button>
);

interface SettingRowProps {
  title: string;
  description: string;
  action: ReactNode;
}

const SettingRow: FC<SettingRowProps> = ({ title, description, action }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1 pr-4">
      <div className="mb-1 text-base font-medium" style={{ color: "white" }}>
        {title}
      </div>
      <div className="text-sm" style={{ color: "#b3b3b3" }}>
        {description}
      </div>
    </div>
    <div>{action}</div>
  </div>
);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const trashbinStore = useTrashbinStore();

  const copyItems = () => {
    const data = {
      songs: trashbinStore.trashSongList,
      artists: trashbinStore.trashArtistList,
    };
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(data));
    Spicetify.showNotification("Copied to clipboard");
  };

  const exportItems = async () => {
    const data = {
      songs: trashbinStore.trashSongList,
      artists: trashbinStore.trashArtistList,
    };

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: "spicetify-trashbin.json",
        types: [
          {
            description: "Spicetify trashbin backup",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data));
      await writable.close();

      Spicetify.showNotification("Backup saved successfully.");
    } catch {
      Spicetify.showNotification(
        "Failed to save, try copying trashbin contents to clipboard and creating a backup manually.",
      );
    }
  };

  const importItems = () => {
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
          trashbinStore.importTrashData(data.songs || {}, data.artists || {});
          Spicetify.showNotification("File Import Successful!");
        } catch (e) {
          Spicetify.showNotification("File Import Failed!", true);
          console.error(e);
        }
      };
      reader.onerror = () => {
        Spicetify.showNotification("File Read Failed!", true);
        console.error(reader.error);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearTrashbin = () => {
    trashbinStore.clearTrashbin();
    Spicetify.showNotification("Trashbin cleared!");
  };

  if (!isOpen) return null;

  // Create portal to render outside of Spicetify's container
  const modalContent = (
    <div
      className="flex items-center justify-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 999999,
        fontFamily: "spotify-circular, Helvetica, Arial, sans-serif",
      }}
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg p-6 shadow-2xl"
        style={{
          backgroundColor: "#121212",
          border: "1px solid #333",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiTrash2 style={{ color: "white" }} size={24} />
            <h2 className="m-0 text-xl font-bold" style={{ color: "white" }}>
              Trashbin Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors"
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#b3b3b3",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "#333")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "transparent")
            }
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Options Section */}
        <div className="mb-8">
          <h3
            className="m-0 mb-4 text-lg font-semibold"
            style={{ color: "white" }}
          >
            Options
          </h3>
          <div className="space-y-1">
            <SettingRow
              title="Enabled"
              description="Enable/disable trashbin functionality"
              action={
                <ToggleButton
                  enabled={trashbinStore.trashbinEnabled}
                  onClick={() =>
                    trashbinStore.setTrashbinEnabled(
                      !trashbinStore.trashbinEnabled,
                    )
                  }
                />
              }
            />
            <SettingRow
              title="Show Widget Icon"
              description="Display trashbin widget in playbar"
              action={
                <ToggleButton
                  enabled={trashbinStore.widgetEnabled}
                  onClick={() =>
                    trashbinStore.setWidgetEnabled(!trashbinStore.widgetEnabled)
                  }
                />
              }
            />
          </div>
        </div>

        {/* Data Management Section */}
        <div>
          <h3
            className="m-0 mb-4 text-lg font-semibold"
            style={{ color: "white" }}
          >
            Data Management
          </h3>
          <div className="flex flex-col gap-3">
            <SettingRow
              title="Copy to Clipboard"
              description="Copy all trashbin items to clipboard"
              action={
                <ActionButton onClick={copyItems}>
                  <FiCopy size={16} />
                </ActionButton>
              }
            />
            <SettingRow
              title="Export to File"
              description="Save trashbin data to JSON file"
              action={
                <ActionButton onClick={exportItems}>
                  <FiDownload size={16} />
                </ActionButton>
              }
            />
            <SettingRow
              title="Import from File"
              description="Load trashbin data from JSON file"
              action={
                <ActionButton onClick={importItems}>
                  <FiUpload size={16} />
                </ActionButton>
              }
            />
            <SettingRow
              title="Clear Trashbin"
              description="Remove all items (cannot be undone)"
              action={
                <ActionButton onClick={clearTrashbin} variant="danger">
                  <FiTrash2 size={16} />
                </ActionButton>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render to document.body using portal
  return ReactDOM.createPortal(modalContent, document.body);
};

export function TrashbinSettings() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const menuItem = new Spicetify.Menu.Item(
      "Trashbin Plus!",
      false,
      () => {
        console.log("Menu clicked, opening modal"); // Debug log
        setIsModalOpen(true);
      },
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentcolor"><path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"/></svg>',
    );

    menuItem.register();

    return () => {
      menuItem.deregister();
    };
  }, []);

  console.log("Modal state:", isModalOpen); // Debug log

  return (
    <SettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  );
}
