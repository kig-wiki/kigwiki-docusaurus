import type {
  FxTwitterFetchError,
  FxTwitterMediaResponse,
  FxTwitterStatus,
  GalleryPost,
} from '../types/fxTwitter';

export const DISPLAY_COUNT = 9;
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
      'FxTwitter could not load posts right now. This is not a Kig.wiki issue — please try viewing the account on X directly.',
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

export async function fetchMakerGalleryPosts(handle: string): Promise<GalleryPost[]> {
  const collected: GalleryPost[] = [];
  const seenIds = new Set<string>();
  let cursor: string | undefined;

  const addUnique = (posts: GalleryPost[]) => {
    for (const post of posts) {
      if (seenIds.has(post.id)) {
        continue;
      }
      seenIds.add(post.id);
      collected.push(post);
      if (collected.length >= DISPLAY_COUNT) {
        break;
      }
    }
  };

  let page = 0;
  while (collected.length < DISPLAY_COUNT && page <= MAX_EXTRA_PAGES) {
    const body = await fetchMediaPage(
      handle,
      INITIAL_FETCH_COUNT,
      page === 0 ? undefined : cursor
    );

    const results = body.results ?? [];
    addUnique(collectEligiblePosts(results));

    const nextCursor = body.cursor?.bottom ?? undefined;
    if (!nextCursor || collected.length >= DISPLAY_COUNT || results.length === 0) {
      break;
    }

    cursor = nextCursor;
    page += 1;
  }

  return collected.slice(0, DISPLAY_COUNT);
}

export function isFxTwitterFetchError(error: unknown): error is FxTwitterFetchError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error
  );
}
