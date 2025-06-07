
import React, { useEffect } from 'react';
import { LuCopy, LuDownload, LuRotateCcw, LuTrash2, LuUpload, LuX } from 'react-icons/lu';
import { cn } from '../lib/utils';
import { useTrashbinStore } from '../store/trashbin-store';

export const TrashbinSettings: React.FC = () => {
  const {
    trashbinEnabled,
    widgetEnabled,
    toggleTrashbin,
    toggleWidget,
    clearTrash,
    exportTrash,
    importTrash,
    copyTrash,
    trashSongList,
    trashArtistList,
    isSettingsOpen,
    setSettingsOpen,
  } = useTrashbinStore();

  const totalTrashItems = Object.keys(trashSongList).length + Object.keys(trashArtistList).length;

  useEffect(() => {
    // Register settings menu item
    const settingsItem = new Spicetify.Menu.Item(
      'Trashbin+ Settings',
      false,
      () => setSettingsOpen(true),
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentcolor"><path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"/></svg>'
    );
    settingsItem.register();

    return () => {
      settingsItem.deregister();
    };
  }, [setSettingsOpen]);

  if (!isSettingsOpen) return null;

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onToggle: (enabled: boolean) => void; 
    label: string;
    description?: string; 
  }> = ({ enabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <span className="text-white font-medium">{label}</span>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={cn(
          "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900",
          enabled ? "bg-spotify-green focus:ring-spotify-green" : "bg-gray-600 focus:ring-gray-500"
        )}
        aria-label={`Toggle ${label}`}
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-md",
            enabled ? "translate-x-7" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );

  const ActionButton: React.FC<{ 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string; 
    variant?: 'danger' | 'default';
    disabled?: boolean;
  }> = ({ onClick, icon, label, variant = 'default', disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === 'danger'
          ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          : "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-gray-900 rounded-lg p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LuTrash2 className="text-spotify-green" size={24} />
            <h2 className="text-xl font-bold text-white">Trashbin+ Settings</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close settings"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Options */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Options</h3>
            <div className="space-y-2 border-b border-gray-800 pb-4">
              <ToggleSwitch
                enabled={trashbinEnabled}
                onToggle={toggleTrashbin}
                label="Enable Trashbin"
                description="Automatically skip songs/artists in trashbin"
              />
              <ToggleSwitch
                enabled={widgetEnabled}
                onToggle={toggleWidget}
                label="Show Widget Icon"
                description="Display floating trash button"
              />
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Songs in trash:</span>
                <span className="text-white font-medium">{Object.keys(trashSongList).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Artists in trash:</span>
                <span className="text-white font-medium">{Object.keys(trashArtistList).length}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-700 pt-2">
                <span className="text-gray-300">Total items:</span>
                <span className="text-spotify-green">{totalTrashItems}</span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Data Management</h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                onClick={copyTrash}
                icon={<LuCopy size={16} />}
                label="Copy"
                disabled={totalTrashItems === 0}
              />
              <ActionButton
                onClick={exportTrash}
                icon={<LuDownload size={16} />}
                label="Export"
                disabled={totalTrashItems === 0}
              />
              <ActionButton
                onClick={importTrash}
                icon={<LuUpload size={16} />}
                label="Import"
              />
              <ActionButton
                onClick={clearTrash}
                icon={<LuRotateCcw size={16} />}
                label="Clear"
                variant="danger"
                disabled={totalTrashItems === 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

