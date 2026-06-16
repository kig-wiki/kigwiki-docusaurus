import { useCallback, useRef, useState } from 'react';
import type { GalleryPost } from '../../types/fxTwitter';
import {
  fetchMakerGalleryPage,
  fetchMakerGalleryPosts,
  isFxTwitterFetchError,
  POSTS_PER_PAGE,
} from '../../utils/fxTwitterApi';
import {
  getCachedPosts,
  hasContentConsent,
  setCachedPosts,
  setContentConsent,
  updateCachedPosts,
} from '../../utils/fxTwitterCache';
import { prefetchGalleryMedia } from '../../utils/mediaCache';

const FETCH_DEBOUNCE_MS = 500;

function getGalleryPreviewUrls(posts: GalleryPost[]): string[] {
  return posts
    .map((post) => (post.mediaType === 'photo' ? post.mediaUrl : post.posterUrl))
    .filter((url): url is string => Boolean(url));
}

export type MakerRecentPostsState =
  | 'idle'
  | 'awaitingConsent'
  | 'loading'
  | 'gallery'
  | 'error';

interface UseMakerRecentPostsResult {
  state: MakerRecentPostsState;
  posts: GalleryPost[];
  pageIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  errorMessage: string | null;
  partialResultsNote: string | null;
  open: () => void;
  confirmConsent: () => void;
  cancelConsent: () => void;
  closeGallery: () => void;
  dismissError: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  dismissLoadMoreError: () => void;
}

export function useMakerRecentPosts(handle: string): UseMakerRecentPostsResult {
  const [state, setState] = useState<MakerRecentPostsState>('idle');
  const [allPosts, setAllPosts] = useState<GalleryPost[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInFlightRef = useRef(false);
  const lastFetchAttemptRef = useRef(0);

  const visiblePosts = allPosts.slice(
    pageIndex * POSTS_PER_PAGE,
    (pageIndex + 1) * POSTS_PER_PAGE
  );

  const canGoPrevious = pageIndex > 0;
  const hasNextPageCached = (pageIndex + 1) * POSTS_PER_PAGE < allPosts.length;
  const canGoNext = hasNextPageCached || (!exhausted && nextCursor !== null);

  const partialResultsNote =
    exhausted && visiblePosts.length > 0 && visiblePosts.length < POSTS_PER_PAGE
      ? 'Only recent standalone media posts are shown. Some accounts may have fewer than nine eligible posts.'
      : null;

  const applyGalleryResult = useCallback(
    (
      posts: GalleryPost[],
      cursor: string | null,
      isExhausted: boolean,
      newPostsForPrefetch: GalleryPost[]
    ) => {
      setAllPosts(posts);
      setNextCursor(cursor);
      setExhausted(isExhausted);
      prefetchGalleryMedia(getGalleryPreviewUrls(newPostsForPrefetch));
    },
    []
  );

  const resetGalleryState = useCallback(() => {
    setAllPosts([]);
    setPageIndex(0);
    setNextCursor(null);
    setExhausted(false);
    setIsLoadingMore(false);
    setLoadMoreError(null);
    fetchInFlightRef.current = false;
    lastFetchAttemptRef.current = 0;
  }, []);

  const loadPosts = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);
    setLoadMoreError(null);
    resetGalleryState();

    const cached = getCachedPosts(handle);
    if (cached) {
      applyGalleryResult(cached.posts, cached.nextCursor, cached.exhausted, cached.posts);
      setState('gallery');
      return;
    }

    try {
      const result = await fetchMakerGalleryPosts(handle);
      if (result.posts.length === 0) {
        setErrorMessage(
          'FxTwitter returned no standalone media posts for this account. Please view the profile directly on X.'
        );
        setState('error');
        return;
      }

      setCachedPosts(handle, result.posts, result.nextCursor, result.exhausted);
      applyGalleryResult(result.posts, result.nextCursor, result.exhausted, result.posts);
      setState('gallery');
    } catch (error) {
      const message = isFxTwitterFetchError(error)
        ? error.message
        : 'FxTwitter could not load posts right now. Please view this account directly on X.';
      setErrorMessage(message);
      setState('error');
    }
  }, [handle, applyGalleryResult, resetGalleryState]);

  const fetchNextPage = useCallback(async () => {
    const now = Date.now();
    if (
      fetchInFlightRef.current ||
      now - lastFetchAttemptRef.current < FETCH_DEBOUNCE_MS
    ) {
      return;
    }

    if (!nextCursor || exhausted) {
      return;
    }

    fetchInFlightRef.current = true;
    lastFetchAttemptRef.current = now;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    const excludeIds = new Set(allPosts.map((post) => post.id));

    try {
      const result = await fetchMakerGalleryPage(handle, {
        cursor: nextCursor,
        excludeIds,
      });

      if (result.posts.length === 0) {
        setExhausted(true);
        setNextCursor(null);
        updateCachedPosts(handle, allPosts, null, true);
        setLoadMoreError(
          'FxTwitter has no more standalone media posts for this account.'
        );
        return;
      }

      const mergedPosts = [...allPosts, ...result.posts];
      updateCachedPosts(handle, mergedPosts, result.nextCursor, result.exhausted);
      applyGalleryResult(
        mergedPosts,
        result.nextCursor,
        result.exhausted,
        result.posts
      );
      setPageIndex((current) => current + 1);
    } catch (error) {
      const message = isFxTwitterFetchError(error)
        ? error.message
        : 'FxTwitter could not load more posts right now. You can keep browsing posts already loaded.';
      setLoadMoreError(message);
    } finally {
      fetchInFlightRef.current = false;
      setIsLoadingMore(false);
    }
  }, [allPosts, applyGalleryResult, exhausted, handle, nextCursor]);

  const open = useCallback(() => {
    if (!hasContentConsent()) {
      setState('awaitingConsent');
      return;
    }
    void loadPosts();
  }, [loadPosts]);

  const confirmConsent = useCallback(() => {
    setContentConsent();
    void loadPosts();
  }, [loadPosts]);

  const cancelConsent = useCallback(() => {
    setState('idle');
  }, []);

  const closeGallery = useCallback(() => {
    setState('idle');
    resetGalleryState();
  }, [resetGalleryState]);

  const dismissError = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
  }, []);

  const dismissLoadMoreError = useCallback(() => {
    setLoadMoreError(null);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setLoadMoreError(null);
    setPageIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setLoadMoreError(null);

    if ((pageIndex + 1) * POSTS_PER_PAGE < allPosts.length) {
      setPageIndex((current) => current + 1);
      return;
    }

    void fetchNextPage();
  }, [allPosts.length, fetchNextPage, pageIndex]);

  return {
    state,
    posts: visiblePosts,
    pageIndex,
    canGoPrevious,
    canGoNext,
    isLoadingMore,
    loadMoreError,
    errorMessage,
    partialResultsNote,
    open,
    confirmConsent,
    cancelConsent,
    closeGallery,
    dismissError,
    goToPreviousPage,
    goToNextPage,
    dismissLoadMoreError,
  };
}
