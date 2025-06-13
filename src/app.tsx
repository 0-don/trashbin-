import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { TrashbinQueuelist } from "./components/features/injections/trashbin-queuelist";
import { TrashbinTracklist } from "./components/features/injections/trashbin-tracklist";
import { TrashbinContextMenu } from "./components/features/trashbin-context-menu";
import { TrashbinWidget } from "./components/features/trashbin-widget";
import { Providers } from "./components/providers/providers";
import { TrashbinSettings } from "./components/ui/settings-modal";
import { TrashedItemsModal } from "./components/ui/trashed-items-modal";
import "./global.css";
import { SELECTORS } from "./lib/constants";
import {
  isTrackEffectivelyTrashed,
  skipToNextAllowedTrack,
} from "./lib/track-utils";
import { useTrashbinStore } from "./store/trashbin-store";

async function restartCurrentPlaylist(): Promise<void> {
  const playerData = Spicetify.Player.data;

  if (!playerData?.item) {
    Spicetify.showNotification("No track is currently playing.", true);
    return;
  }

  const contextUriString = playerData.context_uri || playerData.context?.uri;
  if (!contextUriString) {
    Spicetify.showNotification(
      "Not currently playing from a playlist or album context.",
      true,
    );
    return;
  }

  const contextUri = Spicetify.URI.fromString(contextUriString);
  if (
    contextUri.type !== Spicetify.URI.Type.PLAYLIST &&
    contextUri.type !== Spicetify.URI.Type.PLAYLIST_V2
  ) {
    Spicetify.showNotification("Not currently playing from a playlist.", true);
    return;
  }

  const playlistId = contextUri.id;
  if (!playlistId) {
    Spicetify.showNotification("Could not extract playlist ID.", true);
    return;
  }

  try {
    // Clear queue
    const playerAPI = Spicetify.Platform?.PlayerAPI;
    if (playerAPI?.clearQueue) {
      await playerAPI.clearQueue();
    } else if (playerAPI?._queue?.clearQueue) {
      await playerAPI._queue.clearQueue();
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Restart playlist
    await Spicetify.Player.playUri(
      contextUriString,
      { uri: contextUriString },
      { skipTo: { index: 0 } },
    );

    Spicetify.showNotification(
      `Playlist restarted: ${playerData.context?.metadata?.context_description || playlistId}`,
    );
  } catch (error) {
    Spicetify.showNotification("Error restarting playlist.", true);
    console.error("Error during playlist restart:", error);
  }
}

function App() {
  const trashbinStore = useTrashbinStore();

  useEffect(() => {
    trashbinStore.initializeFromStorage();
  }, [trashbinStore.initializeFromStorage]);

  useEffect(() => {
    if (trashbinStore.autoplayOnStart && !Spicetify.Player.isPlaying())
      Spicetify.Player.play();
  }, [trashbinStore.autoplayOnStart]);

  useEffect(() => {
    console.log(
      "Spicetify Player shuffle state:",
      Spicetify.Player.getShuffle(),
    );
  }, [Spicetify.Player.getShuffle, Spicetify.Player.data?.shuffle]);

  useEffect(() => {
    if (!trashbinStore.trashbinEnabled) return;

    const skipBackBtn =
      document.querySelector(SELECTORS.SKIP_BACK_BUTTON) ??
      document.querySelector(SELECTORS.SKIP_BACK_BUTTON_ALT);

    const eventListener = () => trashbinStore.setUserHitBack(true);

    const handleSongChange = () => {
      const track = Spicetify.Player.data?.item;
      const state = useTrashbinStore.getState();

      if (state.userHitBack) {
        trashbinStore.setUserHitBack(false);
        return;
      }
      if (
        isTrackEffectivelyTrashed(
          track,
          state.trashSongList,
          state.trashArtistList,
        )
      ) {
        skipToNextAllowedTrack();
      }
    };

    skipBackBtn?.addEventListener("click", eventListener);
    Spicetify.Player.addEventListener("songchange", handleSongChange);

    return () => {
      skipBackBtn?.removeEventListener("click", eventListener);
      Spicetify.Player.removeEventListener("songchange", handleSongChange);
    };
  }, [
    trashbinStore.trashbinEnabled,
    trashbinStore.setUserHitBack,
    skipToNextAllowedTrack,
  ]);

  return (
    <>
      <div
        onClick={restartCurrentPlaylist}
        className="z-50 !cursor-pointer text-red-500"
      >
        trashbin+
      </div>
      <Providers>
        <TrashbinWidget />
        <TrashbinSettings />
        <TrashedItemsModal />
        <TrashbinContextMenu />
        <TrashbinTracklist />
        <TrashbinQueuelist />
      </Providers>
    </>
  );
}

async function main() {
  const appRoot = document.createElement("div");
  appRoot.id = "trashbin-plus-root";
  appRoot.className = "fixed top-0 left-0 !z-[9999] pointer-events-none";

  document.body.appendChild(appRoot);
  ReactDOM.render(<App />, appRoot);

  console.log(
    "Spicetify is ready! Attaching Trashbin+ React component.",
    Spicetify,
    Spicetify.Locale.getLocale(),
  );

  return () => {
    ReactDOM.unmountComponentAtNode(appRoot);
    appRoot.remove();
  };
}

export default main;
