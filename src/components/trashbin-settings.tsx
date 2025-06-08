import { useEffect } from "react";
import { TRASH_ICON } from "../lib/icons";
import { useTrashbinStore } from "../store/trashbin-store";

export function TrashbinSettings() {
  const trashbinStore = useTrashbinStore();

  const copyItems = () => {
    const data = trashbinStore.exportData();
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(data));
    Spicetify.showNotification("Copied to clipboard");
  };

  const exportItems = async () => {
    const data = trashbinStore.exportData();
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: "spicetify-trashbin.json",
        types: [
          {
            description: "Spicetify trashbin backup",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data));
      await writable.close();

      Spicetify.showNotification("Backup saved successfully.");
    } catch {
      Spicetify.showNotification(
        "Failed to save, try copying trashbin contents to clipboard and creating a backup manually.",
      );
    }
  };

  const importItems = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          trashbinStore.importTrashData(data.songs || {}, data.artists || {});
          Spicetify.showNotification("File Import Successful!");
        } catch (e) {
          Spicetify.showNotification("File Import Failed!", true);
          console.error(e);
        }
      };
      reader.onerror = () => {
        Spicetify.showNotification("File Read Failed!", true);
        console.error(reader.error);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearTrashbin = () => {
    trashbinStore.clearTrashbin();
    Spicetify.showNotification("Trashbin cleared!");
  };

  useEffect(() => {
    const settingsContent = document.createElement("div");
    settingsContent.className = "space-y-6 p-4";

    // Create settings UI
    settingsContent.innerHTML = `
      <style>
        .setting-row {
          display: flex;
          padding: 10px 0;
          align-items: center;
          justify-content: space-between;
        }
        .setting-row .col.description {
          width: 100%;
          padding-right: 15px;
        }
        .setting-row .col.action {
          text-align: right;
        }
        button.switch {
          align-items: center;
          border: 0px;
          border-radius: 50%;
          background-color: rgba(var(--spice-rgb-shadow), .7);
          color: var(--spice-text);
          cursor: pointer;
          display: flex;
          margin-inline-start: 12px;
          padding: 8px;
        }
        button.switch.disabled {
          color: rgba(var(--spice-rgb-text), .3);
        }
        button.reset {
          font-weight: 700;
          font-size: medium;
          background-color: transparent;
          border-radius: 500px;
          transition-duration: 33ms;
          padding-inline: 15px;
          border: 1px solid #727272;
          color: var(--spice-text);
          min-block-size: 32px;
          cursor: pointer;
        }
        button.reset:hover {
          transform: scale(1.04);
          border-color: var(--spice-text);
        }
      </style>
      <h2>Options</h2>
      <div class="setting-row">
        <label class="col description">Enabled</label>
        <div class="col action">
          <button class="switch ${!trashbinStore.trashbinEnabled ? "disabled" : ""}" id="enabled-toggle">
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              ${Spicetify.SVGIcons.check}
            </svg>
          </button>
        </div>
      </div>
      <div class="setting-row">
        <label class="col description">Show Widget Icon</label>
        <div class="col action">
          <button class="switch ${!trashbinStore.widgetEnabled ? "disabled" : ""}" id="widget-toggle">
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              ${Spicetify.SVGIcons.check}
            </svg>
          </button>
        </div>
      </div>
      <h2>Local Storage</h2>
      <div class="setting-row">
        <label class="col description">Copy all items in trashbin to clipboard.</label>
        <div class="col action"><button class="reset" id="copy-btn">Copy</button></div>
      </div>
      <div class="setting-row">
        <label class="col description">Save all items in trashbin to a .json file.</label>
        <div class="col action"><button class="reset" id="export-btn">Export</button></div>
      </div>
      <div class="setting-row">
        <label class="col description">Overwrite all items in trashbin via .json file.</label>
        <div class="col action"><button class="reset" id="import-btn">Import</button></div>
      </div>
      <div class="setting-row">
        <label class="col description">Clear all items from trashbin (cannot be reverted).</label>
        <div class="col action"><button class="reset" id="clear-btn">Clear</button></div>
      </div>
    `;

    // Add event listeners
    settingsContent
      .querySelector("#enabled-toggle")
      ?.addEventListener("click", (e) => {
        const button = e.target as HTMLElement;
        const newState = button.classList.contains("disabled");
        button.classList.toggle("disabled");
        trashbinStore.setTrashbinEnabled(newState);
      });

    settingsContent
      .querySelector("#widget-toggle")
      ?.addEventListener("click", (e) => {
        const button = e.target as HTMLElement;
        const newState = button.classList.contains("disabled");
        button.classList.toggle("disabled");
        trashbinStore.setWidgetEnabled(newState);
      });

    settingsContent
      .querySelector("#copy-btn")
      ?.addEventListener("click", copyItems);
    settingsContent
      .querySelector("#export-btn")
      ?.addEventListener("click", exportItems);
    settingsContent
      .querySelector("#import-btn")
      ?.addEventListener("click", importItems);
    settingsContent
      .querySelector("#clear-btn")
      ?.addEventListener("click", clearTrashbin);

    const menuItem = new Spicetify.Menu.Item(
      "Trashbin Pl",
      false,
      () => {
        Spicetify.PopupModal.display({
          title: "Trashbin Settings",
          content: settingsContent,
        });
      },
      TRASH_ICON,
    );

    menuItem.register();

    return () => {
      menuItem.deregister();
    };
  }, []);

  return null;
}
