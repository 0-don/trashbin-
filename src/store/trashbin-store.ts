import { create } from "zustand";
import { MESSAGES } from "../lib/constants";
import { shouldSkipTrack } from "../lib/track-utils";

export const STORAGE_KEYS = {
  ENABLED: "trashbin-enabled",
  WIDGET: "TrashbinWidgetIcon",
  SONGS: "TrashSongList",
  ARTISTS: "TrashArtistList",
  AUTOPLAY_ON_START: "trashbin-autoplay-on-start",
  QUEUE_TRASHBIN: "trashbin-queue-enabled",
  TRACKLIST_TRASHBIN: "trashbin-tracklist-enabled",
  RESHUFFLE_ON_SKIP: "trashbin-reshuffle-on-skip",
} as const;

interface TrashbinState {
  // Core state
  trashbinEnabled: boolean;
  widgetEnabled: boolean;
  autoplayOnStart: boolean;
  queueTrashbinEnabled: boolean;
  tracklistTrashbinEnabled: boolean;
  reshuffleOnSkip: boolean;
  trashSongList: Record<string, boolean>;
  trashArtistList: Record<string, boolean>;
  userHitBack: boolean;

  // Actions
  initializeFromStorage: () => void;
  setTrashbinEnabled: (enabled: boolean) => void;
  setWidgetEnabled: (enabled: boolean) => void;
  setAutoplayOnStart: (enabled: boolean) => void;
  setQueueTrashbinEnabled: (enabled: boolean) => void;
  setTracklistTrashbinEnabled: (enabled: boolean) => void;
  setReshuffleOnSkip: (enabled: boolean) => void;
  setUserHitBack: (hitBack: boolean) => void;

  // Unified actions
  toggleSongTrash: (uri: string, showNotification?: boolean) => void;
  toggleArtistTrash: (uri: string, showNotification?: boolean) => void;
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

export const useTrashbinStore = create<TrashbinState>((set, get) => ({
  // Initial state
  trashbinEnabled: true,
  widgetEnabled: true,
  autoplayOnStart: false,
  queueTrashbinEnabled: true,
  tracklistTrashbinEnabled: true,
  reshuffleOnSkip: false,
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
      autoplayOnStart: initValue(STORAGE_KEYS.AUTOPLAY_ON_START, false),
      queueTrashbinEnabled: initValue(STORAGE_KEYS.QUEUE_TRASHBIN, true),
      tracklistTrashbinEnabled: initValue(
        STORAGE_KEYS.TRACKLIST_TRASHBIN,
        true,
      ),
      reshuffleOnSkip: initValue(STORAGE_KEYS.RESHUFFLE_ON_SKIP, false),
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

  setAutoplayOnStart: (enabled: boolean) => {
    set({ autoplayOnStart: enabled });
    Spicetify.LocalStorage.set(
      STORAGE_KEYS.AUTOPLAY_ON_START,
      JSON.stringify(enabled),
    );
  },

  setQueueTrashbinEnabled: (enabled: boolean) => {
    set({ queueTrashbinEnabled: enabled });
    Spicetify.LocalStorage.set(
      STORAGE_KEYS.QUEUE_TRASHBIN,
      JSON.stringify(enabled),
    );
  },

  setTracklistTrashbinEnabled: (enabled: boolean) => {
    set({ tracklistTrashbinEnabled: enabled });
    Spicetify.LocalStorage.set(
      STORAGE_KEYS.TRACKLIST_TRASHBIN,
      JSON.stringify(enabled),
    );
  },

  setReshuffleOnSkip: (enabled: boolean) => {
    set({ reshuffleOnSkip: enabled });
    Spicetify.LocalStorage.set(
      STORAGE_KEYS.RESHUFFLE_ON_SKIP,
      JSON.stringify(enabled),
    );
  },

  setUserHitBack: (hitBack: boolean) => set({ userHitBack: hitBack }),

  toggleSongTrash: (uri: string, showNotification = true) => {
    const state = get();
    const isTrashed = !!state.trashSongList[uri];
    const newList = { ...state.trashSongList };

    if (isTrashed) {
      delete newList[uri];
      if (showNotification) {
        Spicetify.showNotification(MESSAGES.SONG_REMOVED);
      }
    } else {
      newList[uri] = true;
      if (showNotification) {
        Spicetify.showNotification(MESSAGES.SONG_ADDED);
      }

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

  toggleArtistTrash: (uri: string, showNotification = true) => {
    const state = get();
    const isTrashed = !!state.trashArtistList[uri];
    const newList = { ...state.trashArtistList };

    if (isTrashed) {
      delete newList[uri];
      if (showNotification) {
        Spicetify.showNotification(MESSAGES.ARTIST_REMOVED);
      }
    } else {
      newList[uri] = true;
      if (showNotification) {
        Spicetify.showNotification(MESSAGES.ARTIST_ADDED);
      }

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
