import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface TrashbinState {
  // Data
  trashSongList: Record<string, boolean>;
  trashArtistList: Record<string, boolean>;

  // Settings
  trashbinEnabled: boolean;
  widgetEnabled: boolean;

  // UI State
  isSettingsOpen: boolean;
  currentTrack: any;

  // Actions
  addToTrash: (uri: string, type: string) => void;
  removeFromTrash: (uri: string, type: string) => void;
  isInTrash: (uri: string, type: string) => boolean;
  clearTrash: () => void;

  // Settings
  toggleTrashbin: (enabled?: boolean) => void;
  toggleWidget: (enabled?: boolean) => void;

  // UI Actions
  setSettingsOpen: (open: boolean) => void;
  setCurrentTrack: (track: any) => void;

  // Data Management
  exportTrash: () => Promise<void>;
  importTrash: () => void;
  copyTrash: () => void;

  // Initialization
  initializeFromStorage: () => void;
  saveToStorage: () => void;
}

const initValue = (key: string, defaultValue: any) => {
  try {
    const value = JSON.parse(Spicetify.LocalStorage?.get(key) || "null");
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

const shouldSkipCurrentTrack = (uri: string, type: string) => {
  const curTrack = Spicetify.Player.data?.item;
  if (!curTrack) return false;

  if (type === "track" && uri === curTrack.uri) {
    return true;
  }

  if (type === "artist") {
    let count = 1;
    let artUri = curTrack.metadata?.artist_uri;
    while (artUri) {
      if (uri === artUri) return true;
      artUri = curTrack.metadata?.[`artist_uri:${count}`];
      count++;
    }
  }

  return false;
};

export const useTrashbinStore = create<TrashbinState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    trashSongList: {},
    trashArtistList: {},
    trashbinEnabled: true,
    widgetEnabled: true,
    isSettingsOpen: false,
    currentTrack: null,

    // Actions
    addToTrash: (uri: string, type: string) => {
      const state = get();

      if (type === "track") {
        set({ trashSongList: { ...state.trashSongList, [uri]: true } });
        Spicetify.showNotification("Song added to trashbin");
      } else if (type === "artist") {
        set({ trashArtistList: { ...state.trashArtistList, [uri]: true } });
        Spicetify.showNotification("Artist added to trashbin");
      }

      // Skip current track if it matches
      if (shouldSkipCurrentTrack(uri, type)) {
        Spicetify.Player.next();
      }

      get().saveToStorage();
    },

    removeFromTrash: (uri: string, type: string) => {
      const state = get();

      if (type === "track") {
        const newList = { ...state.trashSongList };
        delete newList[uri];
        set({ trashSongList: newList });
        Spicetify.showNotification("Song removed from trashbin");
      } else if (type === "artist") {
        const newList = { ...state.trashArtistList };
        delete newList[uri];
        set({ trashArtistList: newList });
        Spicetify.showNotification("Artist removed from trashbin");
      }

      get().saveToStorage();
    },

    isInTrash: (uri: string, type: string) => {
      const state = get();
      return type === "track"
        ? !!state.trashSongList[uri]
        : !!state.trashArtistList[uri];
    },

    clearTrash: () => {
      set({ trashSongList: {}, trashArtistList: {} });
      Spicetify.showNotification("Trashbin cleared!");
      get().saveToStorage();
    },

    toggleTrashbin: (enabled?: boolean) => {
      const state = get();
      const newEnabled = enabled ?? !state.trashbinEnabled;
      set({ trashbinEnabled: newEnabled });
      get().saveToStorage();
    },

    toggleWidget: (enabled?: boolean) => {
      const state = get();
      const newEnabled = enabled ?? !state.widgetEnabled;
      set({ widgetEnabled: newEnabled });
      get().saveToStorage();
    },

    setSettingsOpen: (open: boolean) => {
      set({ isSettingsOpen: open });
    },

    setCurrentTrack: (track: any) => {
      set({ currentTrack: track });
    },

    exportTrash: async () => {
      const state = get();
      const data = {
        songs: state.trashSongList,
        artists: state.trashArtistList,
      };

      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: "spicetify-trashbin-plus.json",
          types: [
            {
              description: "Trashbin+ backup",
              accept: { "application/json": [".json"] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        Spicetify.showNotification("Backup saved successfully");
      } catch {
        Spicetify.showNotification("Export failed", true);
      }
    },

    importTrash: () => {
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
            set({
              trashSongList: data.songs || {},
              trashArtistList: data.artists || {},
            });
            get().saveToStorage();
            Spicetify.showNotification("Import successful!");
          } catch {
            Spicetify.showNotification("Import failed!", true);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },

    copyTrash: () => {
      const state = get();
      const data = {
        songs: state.trashSongList,
        artists: state.trashArtistList,
      };
      Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(data, null, 2));
      Spicetify.showNotification("Copied to clipboard");
    },

    initializeFromStorage: () => {
      set({
        trashSongList: initValue("TrashSongList", {}),
        trashArtistList: initValue("TrashArtistList", {}),
        trashbinEnabled: initValue("trashbin-enabled", true),
        widgetEnabled: initValue("TrashbinWidgetIcon", true),
      });
    },

    saveToStorage: () => {
      const state = get();
      Spicetify.LocalStorage?.set(
        "TrashSongList",
        JSON.stringify(state.trashSongList)
      );
      Spicetify.LocalStorage?.set(
        "TrashArtistList",
        JSON.stringify(state.trashArtistList)
      );
      Spicetify.LocalStorage?.set(
        "trashbin-enabled",
        JSON.stringify(state.trashbinEnabled)
      );
      Spicetify.LocalStorage?.set(
        "TrashbinWidgetIcon",
        JSON.stringify(state.widgetEnabled)
      );
    },
  }))
);
