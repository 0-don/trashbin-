import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { TrashbinContextMenu } from "./components/trashbin-context-menu";
import { TrashbinSettings } from "./components/trashbin-settings";
import { TrashbinWidget } from "./components/trashbin-widget";
import "./global.css";
import { useTrashbinStore } from "./store/trashbin-store";

function App() {
  const trashbinStore = useTrashbinStore();

  useEffect(() => {
    trashbinStore.initializeFromStorage();
  }, []);

  useEffect(() => {
    const skipBackBtn =
      document.querySelector(".main-skipBackButton-button") ??
      document.querySelector(
        ".player-controls__left > button[data-encore-id='buttonTertiary']",
      );

    const eventListener = () => trashbinStore.setUserHitBack(true);

    if (skipBackBtn && trashbinStore.trashbinEnabled) {
      skipBackBtn.addEventListener("click", eventListener);
      return () => {
        skipBackBtn.removeEventListener("click", eventListener);
      };
    }
  }, [trashbinStore.trashbinEnabled]);

  useEffect(() => {
    const handleSongChange = () => {
      const track = Spicetify.Player.data?.item;

      // Always update current track
      trashbinStore.setCurrentTrack(track);

      // Check if user hit back button - if so, don't auto-skip
      if (trashbinStore.userHitBack) {
        trashbinStore.setUserHitBack(false);
        return;
      }

      // Only auto-skip if trashbin is enabled
      if (!track || !trashbinStore.trashbinEnabled) return;

      // Check if song is trashed
      if (trashbinStore.trashSongList[track.uri]) {
        Spicetify.Player.next();
        return;
      }

      // Check if any artist is trashed
      let artistUri = track.metadata?.artist_uri;
      let index = 0;
      while (artistUri) {
        if (trashbinStore.trashArtistList[artistUri]) {
          Spicetify.Player.next();
          return;
        }
        index++;
        artistUri = (track.metadata as any)?.[`artist_uri:${index}`];
      }
    };

    // Set initial track
    handleSongChange();

    Spicetify.Player.addEventListener("songchange", handleSongChange);

    return () => {
      Spicetify.Player.removeEventListener("songchange", handleSongChange);
    };
  }, [
    trashbinStore.trashbinEnabled,
    trashbinStore.trashSongList,
    trashbinStore.trashArtistList,
  ]);

  return (
    <>
      <TrashbinWidget />
      <TrashbinSettings />
      <TrashbinContextMenu />
    </>
  );
}

async function main() {
  console.log("Spicetify is ready! Attaching Trashbin+ React component.");

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
