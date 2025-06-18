import { useTrashbinStore } from "../store/trashbin-store";
import { QUEUELIST_CONFIG, SELECTORS } from "./constants";

const TRACK_URI_REGEX = /spotify:track:([a-zA-Z0-9]+)/;
const ENHANCED_RECOMMENDATION_REGEX = /enhanced_recommendation/;
const UID_REGEX = /"uid":\s*"([^"]+)"/;

export interface TrackData {
  trackURI: string | null;
  uid: string | null;
  artistURIs: string[];
  isEnhancedRecommendation: boolean;
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
  let isEnhancedRecommendation = false;
  let uid: string | null = null;

  const elementWithFiber = element as ElementWithFiber;
  const reactKey = Object.keys(elementWithFiber).find((k) =>
    k.includes("react"),
  );

  if (reactKey) {
    let fiber = elementWithFiber[reactKey] as ReactFiber | undefined;

    while (fiber && (!trackURI || !isEnhancedRecommendation || !uid)) {
      try {
        const props = fiber.memoizedProps ?? fiber.props ?? {};
        const propsString = JSON.stringify(props);

        if (!trackURI) {
          const match = propsString.match(TRACK_URI_REGEX);
          if (match?.[0]) trackURI = match[0];
        }

        if (!isEnhancedRecommendation) {
          isEnhancedRecommendation =
            ENHANCED_RECOMMENDATION_REGEX.test(propsString);
        }

        if (!uid) {
          const uidMatch = propsString.match(UID_REGEX);
          if (uidMatch?.[1]) uid = uidMatch[1];
        }

        fiber = fiber.return;
      } catch {
        break;
      }
    }
  }

  const artistURIs = Array.from(
    element.querySelectorAll<HTMLAnchorElement>(SELECTORS.ARTIST_LINK),
  )
    .map((a) => a.href.match(/\/artist\/([a-zA-Z0-9]+)/)?.[1])
    .filter((id): id is string => Boolean(id))
    .map((id) => `spotify:artist:${id}`);

  return { trackURI, uid, artistURIs, isEnhancedRecommendation };
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

export function shouldSkipTrack(uri: string, type: string): boolean {
  const currentTrack = Spicetify.Player.data?.item;
  if (!currentTrack) return false;

  if (type === Spicetify.URI.Type.TRACK) {
    return uri === currentTrack.uri;
  }

  if (type === Spicetify.URI.Type.ARTIST) {
    let count = 0;
    let artUri = currentTrack.metadata?.artist_uri;
    while (artUri) {
      if (uri === artUri) return true;
      count++;
      artUri = currentTrack.metadata?.[`artist_uri:${count}`];
    }
  }

  return false;
}

export async function manageSmartShuffleQueue(): Promise<void> {
  if (!document.querySelector(SELECTORS.SMART_SHUFFLE_BUTTON)) return;

  const queueTracks = Array.from(
    document.querySelectorAll(
      `${QUEUELIST_CONFIG.containerSelector} ${QUEUELIST_CONFIG.rowSelector}`,
    ),
  )
    .map(extractTrackData)
    .filter((track) => track.uid); // Only queue tracks (not recently played)

  if (queueTracks.length === 0) return;

  const enhancedRecommendations = queueTracks.filter(
    (track) => track.isEnhancedRecommendation,
  );

  if (
    queueTracks.length > 4 &&
    enhancedRecommendations.length <= 4 &&
    queueTracks.length > enhancedRecommendations.length
  ) {
    const queue = Spicetify.Queue;
    if (!queue?.nextTracks?.length) return;

    const tracksToRemove = queueTracks
      .filter(
        (track) =>
          track.trackURI &&
          !track.isEnhancedRecommendation &&
          useTrashbinStore.getState().getTrashStatus(track.trackURI).isTrashed,
      )
      .map((track) => ({
        uri: track.trackURI!,
        uid: track.uid!,
      }));

    // Exit if no tracks to remove (prevent infinite loop)
    if (tracksToRemove.length === 0) return;

    await Spicetify.removeFromQueue(tracksToRemove);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await manageSmartShuffleQueue();
  }
}
