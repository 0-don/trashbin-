export const MESSAGES = {
  THROW: "Place in Trashbin",
  UNTHROW: "Remove from Trashbin",
  COPIED: "Copied to clipboard",
  BACKUP_SAVED_SUCCESS: "Backup saved successfully.",
  BACKUP_SAVED_FAILED:
    "Failed to save backup, try copying trashbin contents to clipboard and creating a backup manually.",
  BACKUP_RESTORED_SUCCESS: "Backup restored successfully.",
  BACKUP_RESTORED_FAILED:
    "Failed to restore backup, try importing trashbin contents from a file manually.",
  BACKUP_RESTORED_FAILED_FILE_READ:
    "Failed to read file, please ensure it is a valid JSON file.",
  TRASHBIN_CLEARED: "Trashbin cleared successfully!",
  SONG_REMOVED: "Song removed from trashbin",
  SONG_ADDED: "Song added to trashbin",
  ARTIST_REMOVED: "Artist removed from trashbin",
  ARTIST_ADDED: "Artist added to trashbin",
} as const;

export const UI_TEXT = {
  TRASHBIN: "Trashbin+",
  TRASHBIN_ITEMS: "Trashbin+ Items",
  SETTINGS: "Trashbin+ Settings",
  SUGGESTED_NAME: "spicetify-trashbin.json",

  // Settings toggles
  ENABLED: "Enabled",
  SHOW_WIDGET_ICON: "Show Widget Icon",
  AUTOPLAY_ON_START: "Autoplay on Start",
  QUEUE_TRASHBIN: "Enable Queue Trashbin",
  TRACKLIST_TRASHBIN: "Enable Tracklist Trashbin",
  RESHUFFLE_ON_SKIP: "Skip to Next Non-Trashed & Reshuffle Queue",

  // Settings sections
  OPTIONS: "Options",
  FEATURES: "Features",
  LOCAL_STORAGE: "Local Storage",

  // Action buttons
  COPY: "Copy",
  EXPORT: "Export",
  IMPORT: "Import",
  CLEAR: "Clear",

  // Action descriptions
  COPY_DESCRIPTION: "Copy all items in trashbin to clipboard.",
  EXPORT_DESCRIPTION: "Save all items in trashbin to a .json file.",
  IMPORT_DESCRIPTION: "Overwrite all items in trashbin via .json file.",
  CLEAR_DESCRIPTION: "Clear all items from trashbin (cannot be reverted).",
} as const;
