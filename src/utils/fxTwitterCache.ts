import type { FxTwitterCacheEntry, GalleryPost } from '../types/fxTwitter';

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CONSENT_KEY = 'kigwiki-x-posts-consent-v1';

function cacheKey(handle: string): string {
  return `kigwiki-fxtwitter-v4:${handle.toLowerCase()}`;
}

export function hasContentConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setContentConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'true');
  } catch {
    // Private browsing or quota exceeded
  }
}

export function getCachedPosts(handle: string): GalleryPost[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(handle));
    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as FxTwitterCacheEntry;
    if (!entry?.fetchedAt || !Array.isArray(entry.posts)) {
      return null;
    }

    if (Date.now() - entry.fetchedAt >= CACHE_TTL_MS) {
      return null;
    }

    return entry.posts;
  } catch {
    return null;
  }
}

export function setCachedPosts(handle: string, posts: GalleryPost[]): void {
  try {
    const entry: FxTwitterCacheEntry = {
      fetchedAt: Date.now(),
      posts,
    };
    localStorage.setItem(cacheKey(handle), JSON.stringify(entry));
  } catch {
    // Private browsing or quota exceeded
  }
}
