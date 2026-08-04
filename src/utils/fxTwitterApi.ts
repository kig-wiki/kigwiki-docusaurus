import type {
  FxTwitterFetchError,
  FxTwitterMediaResponse,
  FxTwitterStatus,
  GalleryPageFetchResult,
  GalleryPost,
} from '../types/fxTwitter';

export const POSTS_PER_PAGE = 9;
export const INITIAL_FETCH_COUNT = 20;
export const MAX_EXTRA_PAGES = 2;
const API_BASE = 'https://api.fxtwitter.com';

function isEligibleStatus(status: FxTwitterStatus): boolean {
  return status.replying_to == null && status.reposted_by == null;
}

export function normalizeStatusMedia(status: FxTwitterStatus): GalleryPost | null {
  const video = status.media?.videos?.[0];
  if (video?.url) {
    return {
      id: status.id,
      tweetUrl: status.url,
      mediaType: 'video',
      mediaUrl: '',
      posterUrl: video.thumbnail_url,
    };
  }

  const photo = status.media?.photos?.[0];
  if (photo?.url) {
    return {
      id: status.id,
      tweetUrl: status.url,
      mediaType: 'photo',
      mediaUrl: photo.url,
    };
  }

  return null;
}

function mapApiError(response: Response, body: FxTwitterMediaResponse): FxTwitterFetchError {
  if (response.status === 429) {
    return {
      kind: 'rate_limit',
      message:
        'FxTwitter (the third-party service we use to load X posts) is temporarily rate-limiting requests. Please view this account directly on X.',
    };
  }

  if (response.status === 503 || response.status >= 500) {
    return {
      kind: 'api_error',
      message:
        'FxTwitter is not responding right now. Please try again in a moment or view this account directly on X.',
    };
  }

  if (response.status === 404) {
    return {
      kind: 'not_found',
      message:
        'FxTwitter could not find this account or its media timeline. Please view the profile directly on X.',
    };
  }

  return {
    kind: 'api_error',
    message:
      body.message ??
      'FxTwitter could not load posts right now. This is not a Kig.wiki issue - please try viewing the account on X directly.',
  };
}

async function fetchMediaPage(
  handle: string,
  count: number,
  cursor?: string
): Promise<FxTwitterMediaResponse> {
  const params = new URLSearchParams({ count: String(count) });
  if (cursor) {
    params.set('cursor', cursor);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/2/profile/${encodeURIComponent(handle)}/media?${params}`);
  } catch {
    throw {
      kind: 'network',
      message:
        'Could not reach FxTwitter to load X posts. Check your connection or view this account directly on X.',
    } satisfies FxTwitterFetchError;
  }

  let body: FxTwitterMediaResponse = { code: response.status };
  try {
    body = (await response.json()) as FxTwitterMediaResponse;
  } catch {
    // Non-JSON error body
  }

  if (!response.ok || body.code !== 200) {
    throw mapApiError(response, body);
  }

  return body;
}

function collectEligiblePosts(results: FxTwitterStatus[]): GalleryPost[] {
  const posts: GalleryPost[] = [];

  for (const status of results) {
    if (!isEligibleStatus(status)) {
      continue;
    }

    const normalized = normalizeStatusMedia(status);
    if (normalized) {
      posts.push(normalized);
    }
  }

  return posts;
}

export async function fetchMakerGalleryPage(
  handle: string,
  options: {
    cursor?: string;
    targetCount?: number;
    excludeIds?: Set<string>;
  } = {}
): Promise<GalleryPageFetchResult> {
  const targetCount = options.targetCount ?? POSTS_PER_PAGE;
  const excludeIds = options.excludeIds ?? new Set<string>();
  const collected: GalleryPost[] = [];
  let cursor = options.cursor;
  let page = 0;
  let exhausted = false;

  while (collected.length < targetCount && page <= MAX_EXTRA_PAGES) {
    const body = await fetchMediaPage(
      handle,
      INITIAL_FETCH_COUNT,
      page === 0 ? cursor : cursor
    );

    const results = body.results ?? [];
    for (const post of collectEligiblePosts(results)) {
      if (excludeIds.has(post.id)) {
        continue;
      }
      collected.push(post);
      if (collected.length >= targetCount) {
        break;
      }
    }

    const nextCursor = body.cursor?.bottom ?? null;
    if (!nextCursor || results.length === 0) {
      exhausted = true;
      break;
    }

    if (collected.length >= targetCount) {
      return {
        posts: collected.slice(0, targetCount),
        nextCursor,
        exhausted: false,
      };
    }

    cursor = nextCursor;
    page += 1;
  }

  if (collected.length < targetCount) {
    exhausted = true;
  }

  return {
    posts: collected,
    nextCursor: exhausted ? null : cursor ?? null,
    exhausted,
  };
}

export async function fetchMakerGalleryPosts(handle: string): Promise<GalleryPageFetchResult> {
  return fetchMakerGalleryPage(handle);
}

export function isFxTwitterFetchError(error: unknown): error is FxTwitterFetchError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error
  );
}
