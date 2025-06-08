import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { TrashbinContextMenu } from "./components/trashbin-context-menu";
import { TrashbinSettings } from "./components/trashbin-settings";
import { TrashbinTracklist } from "./components/trashbin-tracklist";
import { TrashbinWidget } from "./components/trashbin-widget";
import "./global.css";
import { useTrashbinStore } from "./store/trashbin-store";
import { TrashbinQueuelist } from "./components/trashbin-queuelist";

function App() {
  const trashbinStore = useTrashbinStore();

  useEffect(() => {
    trashbinStore.initializeFromStorage();
  }, []);

  useEffect(() => {
    if (!trashbinStore.trashbinEnabled) return;

    const skipBackBtn =
      document.querySelector(".main-skipBackButton-button") ??
      document.querySelector(
        ".player-controls__left > button[data-encore-id='buttonTertiary']",
      );

    const eventListener = () => trashbinStore.setUserHitBack(true);

    const handleSongChange = () => {
      const track = Spicetify.Player.data?.item;
      const state = useTrashbinStore.getState();

      if (state.userHitBack) {
        trashbinStore.setUserHitBack(false);
        return;
      }

      if (!track) return;

      if (state.trashSongList[track.uri]) {
        Spicetify.Player.next();
        return;
      }

      let artistUri = track.metadata?.artist_uri;
      let index = 0;
      while (artistUri) {
        if (state.trashArtistList[artistUri]) {
          Spicetify.Player.next();
          return;
        }
        index++;
        artistUri = (track.metadata as any)?.[`artist_uri:${index}`];
      }
    };

    skipBackBtn?.addEventListener("click", eventListener);
    Spicetify.Player.addEventListener("songchange", handleSongChange);
    handleSongChange();

    return () => {
      skipBackBtn?.removeEventListener("click", eventListener);
      Spicetify.Player.removeEventListener("songchange", handleSongChange);
    };
  }, [trashbinStore.trashbinEnabled]);

  return (
    <>
      <div className="text-red-500">trashbin+</div>
      <TrashbinWidget />
      <TrashbinSettings />
      <TrashbinContextMenu />
      <TrashbinTracklist />
      <TrashbinQueuelist />
    </>
  );
}

async function main() {
  const appRoot = document.createElement("div");
  appRoot.id = "trashbin-plus-root";
  appRoot.className = "fixed top-0 left-0 z-50 pointer-events-none";

  document.body.appendChild(appRoot);
  ReactDOM.render(<App />, appRoot);

  console.log(
    "Spicetify is ready! Attaching Trashbin+ React component.",
    Spicetify,
  );

  Spicetify.Player.play();
  return () => {
    ReactDOM.unmountComponentAtNode(appRoot);
    appRoot.remove();
  };
}

export default main;
