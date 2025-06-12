export type TabType = "songs" | "artists";

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

export type ItemData = TrackDisplayData | ArtistDisplayData;