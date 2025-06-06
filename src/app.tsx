import React from "react";
import ReactDOM from "react-dom";
import "./global.css";

function MyComponent() {
  return <div className="text-red-500 !text-5xl">My Test Component for Tr</div>;
}

async function main() {
  console.log("Spicetify is ready! Attaching Trashbin+ React component.");
  Spicetify.showNotification("Hello from Trashbin+!!!!");

  const appRoot = document.createElement("div");
  appRoot.id = "trashbin-plus-root";

  const mainView = document.querySelector(".main-view-container__scroll-node");

  if (!mainView) {
    console.error("Could not find main view container to inject into.");
    return;
  }

  mainView.prepend(appRoot);

  ReactDOM.render(<MyComponent />, appRoot);

  Spicetify.Player.play();
  
  return () => {
    ReactDOM.unmountComponentAtNode(appRoot);
    appRoot.remove();
  };
}

export default main;
