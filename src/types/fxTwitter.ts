export interface FxTwitterVideo {
  url: string;
  thumbnail_url?: string;
}

export interface FxTwitterPhoto {
  url: string;
}

export interface FxTwitterStatus {
  type: string;
  id: string;
  url: string;
  replying_to?: { screen_name: string } | null;
  reposted_by?: { screen_name: string } | null;
  media?: {
    photos?: FxTwitterPhoto[];
    videos?: FxTwitterVideo[];
  };
}

export interface FxTwitterMediaResponse {
  code: number;
  message?: string;
  results?: FxTwitterStatus[];
  cursor?: {
    bottom?: string | null;
  };
}

export type GalleryMediaType = 'photo' | 'video';

export interface GalleryPost {
  id: string;
  tweetUrl: string;
  mediaType: GalleryMediaType;
  mediaUrl: string;
  posterUrl?: string;
}

export interface FxTwitterCacheEntry {
  fetchedAt: number;
  posts: GalleryPost[];
}

export interface FxTwitterFetchError {
  kind: 'rate_limit' | 'not_found' | 'api_error' | 'network';
  message: string;
}
