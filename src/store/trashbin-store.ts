import { create } from "zustand";
import { MESSAGES } from "../lib/constants";

export const STORAGE_KEYS = {
  ENABLED: "trashbin-enabled",
  WIDGET: "TrashbinWidgetIcon",
  SONGS: "TrashSongList",
  ARTISTS: "TrashArtistList",
} as const;

interface TrashbinState {
  // Core state
  trashbinEnabled: boolean;
  widgetEnabled: boolean;
  trashSongList: Record<string, boolean>;
  trashArtistList: Record<string, boolean>;
  userHitBack: boolean;

  // Actions
  initializeFromStorage: () => void;
  setTrashbinEnabled: (enabled: boolean) => void;
  setWidgetEnabled: (enabled: boolean) => void;
  setUserHitBack: (hitBack: boolean) => void;

  // Unified actions
  toggleSongTrash: (uri: string) => void;
  toggleArtistTrash: (uri: string) => void;
  getTrashStatus: (uri: string) => { isTrashed: boolean; type: string };

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

function initValue<T>(item: string, defaultValue: T): T {
  try {
    const value = Spicetify.LocalStorage.get(item);
    return value ? (JSON.parse(value) ?? defaultValue) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function shouldSkipTrack(uri: string, type: string): boolean {
  const currentTrack = Spicetify.Player.data?.item;
  if (!currentTrack) return false;

  if (type === Spicetify.URI.Type.TRACK) {
    return uri === currentTrack.uri;
  }

  if (type === Spicetify.URI.Type.ARTIST) {
    let count = 0;
    let artUri = currentTrack.metadata?.artist_uri;
    while (artUri) {
      if (uri === artUri) return true;
      count++;
      artUri = (currentTrack.metadata as any)?.[`artist_uri:${count}`];
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
  userHitBack: false,

  // Initialize from localStorage
  initializeFromStorage: () => {
    set({
      trashbinEnabled: initValue(STORAGE_KEYS.ENABLED, true),
      widgetEnabled: initValue(STORAGE_KEYS.WIDGET, true),
      trashSongList: initValue(STORAGE_KEYS.SONGS, {}),
      trashArtistList: initValue(STORAGE_KEYS.ARTISTS, {}),
    });
  },

  setTrashbinEnabled: (enabled: boolean) => {
    set({ trashbinEnabled: enabled });
    Spicetify.LocalStorage.set(STORAGE_KEYS.ENABLED, JSON.stringify(enabled));
  },

  setWidgetEnabled: (enabled: boolean) => {
    set({ widgetEnabled: enabled });
    Spicetify.LocalStorage.set(STORAGE_KEYS.WIDGET, JSON.stringify(enabled));
  },

  setUserHitBack: (hitBack: boolean) => set({ userHitBack: hitBack }),

  toggleSongTrash: (uri: string) => {
    const state = get();
    const isTrashed = !!state.trashSongList[uri];
    const newList = { ...state.trashSongList };

    if (isTrashed) {
      delete newList[uri];
      Spicetify.showNotification(MESSAGES.SONG_REMOVED);
    } else {
      newList[uri] = true;
      Spicetify.showNotification(MESSAGES.SONG_ADDED);

      const currentSpotifyTrack = Spicetify.Player.data?.item;
      if (
        state.trashbinEnabled &&
        currentSpotifyTrack &&
        shouldSkipTrack(uri, Spicetify.URI.Type.TRACK)
      ) {
        Spicetify.Player.next();
      }
    }

    set({ trashSongList: newList });
    Spicetify.LocalStorage.set(STORAGE_KEYS.SONGS, JSON.stringify(newList));
  },

  toggleArtistTrash: (uri: string) => {
    const state = get();
    const isTrashed = !!state.trashArtistList[uri];
    const newList = { ...state.trashArtistList };

    if (isTrashed) {
      delete newList[uri];
      Spicetify.showNotification(MESSAGES.ARTIST_REMOVED);
    } else {
      newList[uri] = true;
      Spicetify.showNotification(MESSAGES.ARTIST_ADDED);

      const currentSpotifyTrack = Spicetify.Player.data?.item;
      if (
        state.trashbinEnabled &&
        currentSpotifyTrack &&
        shouldSkipTrack(uri, Spicetify.URI.Type.ARTIST)
      ) {
        Spicetify.Player.next();
      }
    }

    set({ trashArtistList: newList });
    Spicetify.LocalStorage.set(STORAGE_KEYS.ARTISTS, JSON.stringify(newList));
  },

  getTrashStatus: (uri: string) => {
    const state = get();
    const uriObj = Spicetify.URI.fromString(uri);
    const isTrashed =
      uriObj.type === Spicetify.URI.Type.TRACK
        ? !!state.trashSongList[uri]
        : !!state.trashArtistList[uri];

    return { isTrashed, type: uriObj.type };
  },

  importTrashData: (
    songs: Record<string, boolean>,
    artists: Record<string, boolean>,
  ) => {
    set({ trashSongList: songs, trashArtistList: artists });
    Spicetify.LocalStorage.set(STORAGE_KEYS.SONGS, JSON.stringify(songs));
    Spicetify.LocalStorage.set(STORAGE_KEYS.ARTISTS, JSON.stringify(artists));
  },

  clearTrashbin: () => {
    const emptyList = {};
    set({ trashSongList: emptyList, trashArtistList: emptyList });
    Spicetify.LocalStorage.set(STORAGE_KEYS.SONGS, JSON.stringify(emptyList));
    Spicetify.LocalStorage.set(STORAGE_KEYS.ARTISTS, JSON.stringify(emptyList));
  },

  exportData: () => {
    const state = get();
    return { songs: state.trashSongList, artists: state.trashArtistList };
  },
}));
