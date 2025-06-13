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
      {/* <div
        onClick={manageSmartShuffleQueue}
        className="pointer-events-auto cursor-pointer text-red-500"
      >
        trashbin+
      </div> */}
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
  appRoot.className = "fixed top-0 left-0 z-50 pointer-events-none";

  document.body.appendChild(appRoot);
  ReactDOM.render(<App />, appRoot);

  return () => {
    ReactDOM.unmountComponentAtNode(appRoot);
    appRoot.remove();
  };
}

export default main;
