export interface TrackDisplayData {
  uri: string;
  name: string;
  artist: string;
  imageUrl?: string;
}

export interface ArtistDisplayData {
  uri: string;
  name: string;
  type: "artist";
  imageUrl?: string;
  secondaryText: string;
}

export async function fetchTracksBatch(
  trackIds: string[],
): Promise<TrackDisplayData[]> {
  try {
    const response = await Spicetify.CosmosAsync.get(
      `https://api.spotify.com/v1/tracks?ids=${trackIds.join(",")}`,
    );

    return response.tracks.map((track: any, index: number) => ({
      uri: `spotify:track:${trackIds[index]}`,
      name: track?.name || "Unknown Track",
      artist:
        track?.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
      imageUrl: track?.album?.images?.[0]?.url,
    }));
  } catch (error) {
    console.error("Failed to fetch tracks:", error);
    return trackIds.map((id) => ({
      uri: `spotify:track:${id}`,
      name: "Error loading track",
      artist: "Failed to load",
    }));
  }
}

export async function fetchTracksMetadata(
  uris: string[],
  offset = 0,
  limit = 50,
): Promise<TrackDisplayData[]> {
  const batch = uris.slice(offset, offset + limit);
  const trackIds = batch.map((uri) => uri.split(":")[2]);

  // Split into chunks of 50 (Spotify API limit)
  const results: TrackDisplayData[] = [];
  for (let i = 0; i < trackIds.length; i += 50) {
    const chunk = trackIds.slice(i, i + 50);
    const chunkResults = await fetchTracksBatch(chunk);
    results.push(...chunkResults);
  }

  return results;
}

async function fetchArtistsBatch(
  artistIds: string[],
): Promise<ArtistDisplayData[]> {
  try {
    const response = await Spicetify.CosmosAsync.get(
      `https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`,
    );

    return response.artists.map((artist: any, index: number) => ({
      uri: `spotify:artist:${artistIds[index]}`,
      name: artist?.name || "Unknown Artist",
      type: "artist" as const,
      imageUrl: artist?.images?.[0]?.url,
      secondaryText: "Artist",
    }));
  } catch (error) {
    console.error("Failed to fetch artists batch:", error);
    return artistIds.map((id) => ({
      uri: `spotify:artist:${id}`,
      name: "Error loading artist",
      type: "artist" as const,
      secondaryText: "Failed to load",
    }));
  }
}

export async function fetchArtistsMetadata(
  uris: string[],
  offset = 0,
  limit = 50,
): Promise<ArtistDisplayData[]> {
  const batch = uris.slice(offset, offset + limit);
  const artistIds = batch.map((uri) => uri.split(":")[2]);

  // Split into chunks of 50 (Spotify API limit)
  const results: ArtistDisplayData[] = [];
  for (let i = 0; i < artistIds.length; i += 50) {
    const chunk = artistIds.slice(i, i + 50);
    const chunkResults = await fetchArtistsBatch(chunk);
    results.push(...chunkResults);
  }

  return results;
}
