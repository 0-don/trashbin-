import { useTrashbinStore } from "../store/trashbin-store";

const TRACK_URI_REGEX = /spotify:track:([a-zA-Z0-9]+)/;

export interface TrackData {
  trackURI: string | null;
  artistURIs: string[];
}

interface ReactFiber {
  memoizedProps?: Record<string, unknown>;
  props?: Record<string, unknown>;
  return?: ReactFiber;
}

interface ElementWithFiber extends Element {
  [key: string]: unknown;
}

export function extractTrackData(element: Element): TrackData {
  let trackURI: string | null = null;

  const elementWithFiber = element as ElementWithFiber;
  const reactKey = Object.keys(elementWithFiber).find((k) =>
    k.includes("react"),
  );

  if (reactKey) {
    let fiber = elementWithFiber[reactKey] as ReactFiber | undefined;

    while (fiber && !trackURI) {
      try {
        const props = fiber.memoizedProps ?? fiber.props ?? {};
        const match = JSON.stringify(props).match(TRACK_URI_REGEX);
        if (match?.[0]) trackURI = match[0];
        fiber = fiber.return;
      } catch {
        break;
      }
    }
  }

  const artistURIs = Array.from(
    element.querySelectorAll<HTMLAnchorElement>('a[href*="/artist/"]'),
  )
    .map((a) => a.href.match(/\/artist\/([a-zA-Z0-9]+)/)?.[1])
    .filter((id): id is string => Boolean(id))
    .map((id) => `spotify:artist:${id}`);

  return { trackURI, artistURIs };
}

export function isTrackEffectivelyTrashed(
  track: Spicetify.PlayerTrack | Spicetify.ContextTrack | undefined | null,
  trashSongList: Record<string, boolean>,
  trashArtistList: Record<string, boolean>,
): boolean {
  if (!track || !track.uri) return true;
  if (trashSongList[track.uri]) return true;

  const artistUris = new Set<string>();
  const playerTrack = track as Spicetify.PlayerTrack;

  for (const artist of playerTrack.artists || []) {
    if (artist && artist.uri) artistUris.add(artist.uri);
  }

  if (track.metadata?.artist_uri) artistUris.add(track.metadata.artist_uri);

  let metaIndex = 1;
  while (track.metadata?.[`artist_uri:${metaIndex}`]) {
    artistUris.add(track.metadata[`artist_uri:${metaIndex}`]);
    metaIndex++;
  }

  for (const artistUri of artistUris) {
    if (trashArtistList[artistUri]) return true;
  }
  return false;
}

export async function skipToNextAllowedTrack() {
  const state = useTrashbinStore.getState();
  const currentPlayerState = Spicetify.Player.data;

  if (!currentPlayerState?.context?.uri) {
    Spicetify.Player.next();
    return;
  }

  // If reshuffle is enabled, search for next non-trashed track
  if (state.reshuffleOnSkip) {
    const currentContextUri = currentPlayerState.context.uri;
    const tracksToSearch =
      currentPlayerState.nextItems || Spicetify.Queue?.nextTracks || [];

    for (const nextTrack of tracksToSearch) {
      if (
        !isTrackEffectivelyTrashed(
          nextTrack,
          state.trashSongList,
          state.trashArtistList,
        )
      ) {
        try {
          await Spicetify.Player.playUri(
            currentContextUri,
            {},
            { skipTo: { uri: nextTrack.uri, uid: nextTrack.uid } },
          );
          return;
        } catch (_) {}
      }
    }
  }

  // Default behavior: just skip to next
  Spicetify.Player.next();
}
