import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { TrashbinWidget } from "./components/trashbin-widget";
import "./global.css";
import { useTrashbinStore } from "./store/trashbin-store";
import { TrashbinContextMenu } from "./components/trashbin-context-menu.";
import { TrashbinSettings } from "./components/trashbin-settings";

function App() {
  const { initializeFromStorage, setCurrentTrack, trashbinEnabled } =
    useTrashbinStore();

  useEffect(() => {
    // Initialize store from localStorage
    initializeFromStorage();

    // Set up player event listeners
    const updateCurrentTrack = () => {
      const track = Spicetify.Player.data?.item;
      setCurrentTrack(track);
    };

    updateCurrentTrack();
    Spicetify.Player.addEventListener("songchange", updateCurrentTrack);

    return () => {
      Spicetify.Player.removeEventListener("songchange", updateCurrentTrack);
    };
  }, [initializeFromStorage, setCurrentTrack]);

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
