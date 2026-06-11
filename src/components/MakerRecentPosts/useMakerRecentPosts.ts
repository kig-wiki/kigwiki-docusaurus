import { useCallback, useState } from 'react';
import type { GalleryPost } from '../../types/fxTwitter';
import {
  fetchMakerGalleryPosts,
  isFxTwitterFetchError,
} from '../../utils/fxTwitterApi';
import {
  getCachedPosts,
  hasContentConsent,
  setCachedPosts,
  setContentConsent,
} from '../../utils/fxTwitterCache';
import { prefetchGalleryMedia } from '../../utils/mediaCache';

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
  errorMessage: string | null;
  partialResultsNote: string | null;
  open: () => void;
  confirmConsent: () => void;
  cancelConsent: () => void;
  closeGallery: () => void;
  dismissError: () => void;
}

export function useMakerRecentPosts(handle: string): UseMakerRecentPostsResult {
  const [state, setState] = useState<MakerRecentPostsState>('idle');
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [partialResultsNote, setPartialResultsNote] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);
    setPartialResultsNote(null);

    const cached = getCachedPosts(handle);
    if (cached) {
      setPosts(cached);
      prefetchGalleryMedia(getGalleryPreviewUrls(cached));
      if (cached.length < 9) {
        setPartialResultsNote(
          'Only recent standalone media posts are shown. Some accounts may have fewer than nine eligible posts.'
        );
      }
      setState('gallery');
      return;
    }

    try {
      const fetched = await fetchMakerGalleryPosts(handle);
      if (fetched.length === 0) {
        setErrorMessage(
          'FxTwitter returned no standalone media posts for this account. Please view the profile directly on X.'
        );
        setState('error');
        return;
      }

      setCachedPosts(handle, fetched);
      setPosts(fetched);
      prefetchGalleryMedia(getGalleryPreviewUrls(fetched));
      if (fetched.length < 9) {
        setPartialResultsNote(
          'Only recent standalone media posts are shown. Some accounts may have fewer than nine eligible posts.'
        );
      }
      setState('gallery');
    } catch (error) {
      const message = isFxTwitterFetchError(error)
        ? error.message
        : 'FxTwitter could not load posts right now. Please view this account directly on X.';
      setErrorMessage(message);
      setState('error');
    }
  }, [handle]);

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
    setPartialResultsNote(null);
  }, []);

  const dismissError = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
  }, []);

  return {
    state,
    posts,
    errorMessage,
    partialResultsNote,
    open,
    confirmConsent,
    cancelConsent,
    closeGallery,
    dismissError,
  };
}
