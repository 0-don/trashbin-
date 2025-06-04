async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("Spicetify is ready!");
  // Show message on start.
  Spicetify.showNotification("Hello!");
}

export default main;
