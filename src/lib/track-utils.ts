const TRACK_URI_REGEX = /spotify:track:([a-zA-Z0-9]+)/;

export interface TrackData {
  trackURI: string | null;
  artistURIs: string[];
}

export const extractTrackData = (element: Element): TrackData => {
  // Extract track URI from React fiber
  const reactKey = Object.keys(element).find((k) => k.includes("react"));
  let trackURI = null;
  let fiber = reactKey && (element as any)[reactKey];

  while (fiber && !trackURI) {
    const match = JSON.stringify(
      fiber.memoizedProps || fiber.props || {},
    ).match(TRACK_URI_REGEX);
    if (match) trackURI = match[0];
    fiber = fiber.return;
  }

  // Extract artist URIs
  const artistURIs = Array.from(
    element.querySelectorAll('a[href*="/artist/"]'),
  ).map(
    (a) =>
      `spotify:artist:${(a as HTMLAnchorElement).href.split("/artist/")[1]}`,
  );

  return { trackURI, artistURIs };
};
