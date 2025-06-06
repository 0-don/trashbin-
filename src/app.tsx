import React from "react";
import ReactDOM from "react-dom/client"; // Use this for React 18+

// 1. Define your React component
function MyComponent() {
  return (
    <div style={{ color: "white", margin: "1rem" }}>My Test Component!</div>
  );
}

async function main() {
  // Wait for Spicetify and the DOM to be ready
  while (
    !Spicetify?.showNotification ||
    !document.querySelector(".main-view-container__scroll-node")
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("Spicetify is ready! Attaching React component.");
  Spicetify.showNotification("Hello from Trashbin+!");

  // 2. Create a div to mount our component into
  const appRoot = document.createElement("div");
  appRoot.id = "trashbin-plus-root";

  // 3. Find a place in the DOM to inject our div
  // The 'main-view-container' is a good place to inject content on most pages.
  // We will prepend it to make sure it's at the top.
  const mainView = document.querySelector(".main-view-container__scroll-node");

  if (!mainView) {
    console.error("Could not find main view container to inject into.");
    return;
  }

  mainView.prepend(appRoot);

  // 4. Use ReactDOM to render our component into our div
  // For React 18+ (which you are using based on your package.json)
  const root = ReactDOM.createRoot(appRoot);
  root.render(<MyComponent />);

  // It's good practice to provide a cleanup function for your extension
  // This will be called when the extension is disabled or unloaded
  return () => {
    console.log("Unmounting Trashbin+ component.");
    root.unmount();
    appRoot.remove();
  };
}

export default main;
