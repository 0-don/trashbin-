export const SELECTORS = {
  SKIP_BACK_BUTTON: ".main-skipBackButton-button",
  SKIP_BACK_BUTTON_ALT:
    ".player-controls__left > button[data-encore-id='buttonTertiary']",
  ARTIST_LINK: 'a[href*="/artist/"]',
  TRACK_CREDITS_MODAL: ".main-trackCreditsModal-mainSection",
  TRACK_CREDITS_MODAL_CONTAINER: ".main-trackCreditsModal-container",

  SMART_SHUFFLE_BUTTON: 'button svg path[d^="M4.502 0a.637"]',
} as const;

export const TRACKLIST_CONFIG = {
  containerSelector: "main",
  buttonSelector: ".trashbin-tracklist-btn",
  rowSelector: ".main-trackList-trackListRow",
  moreButtonSelector: ".main-trackList-rowMoreButton",
  buttonClassName: "trashbin-tracklist-btn",
} as const;

export const QUEUELIST_CONFIG = {
  containerSelector: "#Desktop_PanelContainer_Id",
  buttonSelector: ".trashbin-queue-btn",
  rowSelector: '[role="row"]',
  moreButtonSelector: 'button[aria-haspopup="menu"]',
  buttonClassName: "trashbin-queue-btn",
} as const;
