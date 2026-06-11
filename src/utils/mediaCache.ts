export const MEDIA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_NAME = 'kigwiki-maker-posts-media-v1';
const CACHE_HEADER = 'x-kigwiki-cached-at';

function isCacheApiAvailable(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

async function openMediaCache(): Promise<Cache | null> {
  if (!isCacheApiAvailable()) {
    return null;
  }

  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

function isFreshCachedResponse(response: Response): boolean {
  const cachedAt = Number(response.headers.get(CACHE_HEADER));
  return Number.isFinite(cachedAt) && Date.now() - cachedAt < MEDIA_CACHE_TTL_MS;
}

export async function invalidateCachedMedia(url: string): Promise<void> {
  const cache = await openMediaCache();
  if (!cache) {
    return;
  }

  try {
    await cache.delete(url);
  } catch {
    // Ignore cache deletion errors
  }
}

export async function resolveCachedMediaUrl(url: string): Promise<string> {
  const cache = await openMediaCache();
  if (!cache) {
    return url;
  }

  try {
    const cached = await cache.match(url);
    if (cached && isFreshCachedResponse(cached)) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }

    if (cached) {
      await cache.delete(url);
    }
  } catch {
    // Fall through to network fetch
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      await invalidateCachedMedia(url);
      return url;
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set(CACHE_HEADER, String(Date.now()));
    headers.set(
      'Content-Type',
      blob.type || response.headers.get('Content-Type') || 'application/octet-stream'
    );

    await cache.put(url, new Response(blob, { headers }));
    return URL.createObjectURL(blob);
  } catch {
    await invalidateCachedMedia(url);
    return url;
  }
}

export function prefetchGalleryMedia(urls: string[]): void {
  for (const url of urls) {
    void resolveCachedMediaUrl(url).then((resolved) => {
      if (resolved.startsWith('blob:')) {
        URL.revokeObjectURL(resolved);
      }
    });
  }
}
