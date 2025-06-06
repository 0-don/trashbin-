import React from "react";
import ReactDOM from "react-dom";

function MyComponent() {
  return (
    <div style={{ color: "white", margin: "1rem" }}>
      My Test Component for Tr
    </div>
  );
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

  const root = (ReactDOM as any).createRoot(appRoot);
  root.render(<MyComponent />);

  // It's good practice to provide a cleanup function for your extension.
  // This will be called when the extension is disabled or unloaded.
  return () => {
    console.log("Unmounting Trashbin+ component.");
    root.unmount();
    appRoot.remove();
  };
}

export default main;
