import { create } from "zustand";

interface TrashbinState {
  // Core state
  trashbinEnabled: boolean;
  widgetEnabled: boolean;
  trashSongList: Record<string, boolean>;
  trashArtistList: Record<string, boolean>;
  currentTrack: any;
  userHitBack: boolean;

  // Actions
  initializeFromStorage: () => void;
  setTrashbinEnabled: (enabled: boolean) => void;
  setWidgetEnabled: (enabled: boolean) => void;
  setCurrentTrack: (track: any) => void;
  setUserHitBack: (hitBack: boolean) => void;

  // Song management
  addSongToTrash: (uri: string) => void;
  removeSongFromTrash: (uri: string) => void;

  // Artist management
  addArtistToTrash: (uri: string) => void;
  removeArtistFromTrash: (uri: string) => void;

  // Utility functions
  isSongTrashed: (uri: string) => boolean;
  isArtistTrashed: (uri: string) => boolean;
  shouldSkipCurrentTrack: (uri: string, type: string) => boolean;

  // Data management
  importTrashData: (
    songs: Record<string, boolean>,
    artists: Record<string, boolean>,
  ) => void;
  clearTrashbin: () => void;
  exportData: () => {
    songs: Record<string, boolean>;
    artists: Record<string, boolean>;
  };
}

// Helper function to safely parse JSON from localStorage
function initValue<T>(item: string, defaultValue: T): T {
  try {
    const value = Spicetify.LocalStorage.get(item);
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return JSON.parse(value) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper function to check if current track should be skipped
function shouldSkipTrack(
  uri: string,
  type: string,
  currentTrack: any,
): boolean {
  if (!currentTrack) return false;

  if (type === Spicetify.URI.Type.TRACK) {
    return uri === currentTrack.uri;
  }

  if (type === Spicetify.URI.Type.ARTIST) {
    let count = 0;
    let artUri = currentTrack.metadata?.artist_uri;
    while (artUri) {
      if (uri === artUri) {
        return true;
      }
      count++;
      artUri = currentTrack.metadata?.[`artist_uri:${count}`];
    }
  }

  return false;
}

export const useTrashbinStore = create<TrashbinState>((set, get) => ({
  // Initial state
  trashbinEnabled: true,
  widgetEnabled: true,
  trashSongList: {},
  trashArtistList: {},
  currentTrack: null,
  userHitBack: false,

  // Initialize from localStorage
  initializeFromStorage: () => {
    const trashbinEnabled = initValue("trashbin-enabled", true);
    const widgetEnabled = initValue("TrashbinWidgetIcon", true);
    const trashSongList = initValue("TrashSongList", {});
    const trashArtistList = initValue("TrashArtistList", {});

    console.log(
      "test",
      trashbinEnabled,
      widgetEnabled,
      trashSongList,
      trashArtistList,
    );

    set({
      trashbinEnabled,
      widgetEnabled,
      trashSongList,
      trashArtistList,
    });
  },

  // Core setters
  setTrashbinEnabled: (enabled: boolean) => {
    set({ trashbinEnabled: enabled });
    Spicetify.LocalStorage.set("trashbin-enabled", JSON.stringify(enabled));
  },

  setWidgetEnabled: (enabled: boolean) => {
    set({ widgetEnabled: enabled });
    Spicetify.LocalStorage.set("TrashbinWidgetIcon", JSON.stringify(enabled));
  },

  setCurrentTrack: (track: any) => {
    set({ currentTrack: track });
  },

  setUserHitBack: (hitBack: boolean) => {
    set({ userHitBack: hitBack });
  },

  // Song management
  addSongToTrash: (uri: string) => {
    const state = get();
    const newTrashSongList = { ...state.trashSongList, [uri]: true };

    set({ trashSongList: newTrashSongList });
    Spicetify.LocalStorage.set(
      "TrashSongList",
      JSON.stringify(newTrashSongList),
    );

    // Check if current track should be skipped
    if (
      state.trashbinEnabled &&
      shouldSkipTrack(uri, Spicetify.URI.Type.TRACK, state.currentTrack)
    ) {
      Spicetify.Player.next();
    }

    Spicetify.showNotification("Song added to trashbin");
  },

  removeSongFromTrash: (uri: string) => {
    const state = get();
    const newTrashSongList = { ...state.trashSongList };
    delete newTrashSongList[uri];

    set({ trashSongList: newTrashSongList });
    Spicetify.LocalStorage.set(
      "TrashSongList",
      JSON.stringify(newTrashSongList),
    );

    Spicetify.showNotification("Song removed from trashbin");
  },

  // Artist management
  addArtistToTrash: (uri: string) => {
    const state = get();
    const newTrashArtistList = { ...state.trashArtistList, [uri]: true };

    set({ trashArtistList: newTrashArtistList });
    Spicetify.LocalStorage.set(
      "TrashArtistList",
      JSON.stringify(newTrashArtistList),
    );

    // Check if current track should be skipped
    if (
      state.trashbinEnabled &&
      shouldSkipTrack(uri, Spicetify.URI.Type.ARTIST, state.currentTrack)
    ) {
      Spicetify.Player.next();
    }

    Spicetify.showNotification("Artist added to trashbin");
  },

  removeArtistFromTrash: (uri: string) => {
    const state = get();
    const newTrashArtistList = { ...state.trashArtistList };
    delete newTrashArtistList[uri];

    set({ trashArtistList: newTrashArtistList });
    Spicetify.LocalStorage.set(
      "TrashArtistList",
      JSON.stringify(newTrashArtistList),
    );

    Spicetify.showNotification("Artist removed from trashbin");
  },

  // Utility functions
  isSongTrashed: (uri: string) => {
    return !!get().trashSongList[uri];
  },

  isArtistTrashed: (uri: string) => {
    return !!get().trashArtistList[uri];
  },

  shouldSkipCurrentTrack: (uri: string, type: string) => {
    const state = get();
    return shouldSkipTrack(uri, type, state.currentTrack);
  },

  // Data management
  importTrashData: (
    songs: Record<string, boolean>,
    artists: Record<string, boolean>,
  ) => {
    set({
      trashSongList: songs,
      trashArtistList: artists,
    });

    Spicetify.LocalStorage.set("TrashSongList", JSON.stringify(songs));
    Spicetify.LocalStorage.set("TrashArtistList", JSON.stringify(artists));
  },

  clearTrashbin: () => {
    const emptyList = {};

    set({
      trashSongList: emptyList,
      trashArtistList: emptyList,
    });

    Spicetify.LocalStorage.set("TrashSongList", JSON.stringify(emptyList));
    Spicetify.LocalStorage.set("TrashArtistList", JSON.stringify(emptyList));
  },

  exportData: () => {
    const state = get();
    return {
      songs: state.trashSongList,
      artists: state.trashArtistList,
    };
  },
}));
