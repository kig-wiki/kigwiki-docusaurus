import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { GalleryPost } from '../../types/fxTwitter';
import ExpandedPostModal from './ExpandedPostModal';
import GalleryCell from './GalleryCell';
import ModalPortal from './ModalPortal';
import { useModalBodyLock } from './useModalBodyLock';

interface PostsGalleryModalProps {
  open: boolean;
  makerName: string;
  profileUrl: string;
  posts: GalleryPost[];
  pageIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  partialResultsNote: string | null;
  onClose: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onDismissLoadMoreError: () => void;
}

const PostsGalleryModal: React.FC<PostsGalleryModalProps> = memo(
  ({
    open,
    makerName,
    profileUrl,
    posts,
    pageIndex,
    canGoPrevious,
    canGoNext,
    isLoadingMore,
    loadMoreError,
    partialResultsNote,
    onClose,
    onPreviousPage,
    onNextPage,
    onDismissLoadMoreError,
  }) => {
    const titleId = useId();
    const closeRef = useRef<HTMLButtonElement>(null);
    const [expandedPost, setExpandedPost] = useState<GalleryPost | null>(null);

    useModalBodyLock(open);

    useEffect(() => {
      if (!open) {
        setExpandedPost(null);
      }
    }, [open]);

    useEffect(() => {
      if (!open) {
        return;
      }

      closeRef.current?.focus();

      const onKeyDown = (event: KeyboardEvent) => {
        if (expandedPost) {
          return;
        }

        if (event.key === 'Escape') {
          onClose();
          return;
        }

        if (event.key === 'ArrowLeft' && canGoPrevious && !isLoadingMore) {
          event.preventDefault();
          onPreviousPage();
          return;
        }

        if (event.key === 'ArrowRight' && canGoNext && !isLoadingMore) {
          event.preventDefault();
          onNextPage();
        }
      };

      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [
      open,
      onClose,
      expandedPost,
      canGoPrevious,
      canGoNext,
      isLoadingMore,
      onPreviousPage,
      onNextPage,
    ]);

    const handleBackdropClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onClose();
      },
      [onClose]
    );

    const handlePostClick = useCallback((post: GalleryPost) => {
      setExpandedPost(post);
    }, []);

    const handleCloseExpandedPost = useCallback(() => {
      setExpandedPost(null);
    }, []);

    if (!open) {
      return null;
    }

    return (
      <ModalPortal>
        <div className="maker-posts-overlay">
          <button
            type="button"
            className="maker-posts-backdrop"
            onClick={handleBackdropClick}
            aria-label="Close gallery"
          />
          <div
            className="maker-posts-dialog maker-posts-gallery-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="maker-posts-gallery-header">
              <h2 id={titleId} className="maker-posts-dialog-title">
                Recent posts from {makerName}
              </h2>
              <button
                ref={closeRef}
                type="button"
                className="maker-posts-close-btn"
                onClick={onClose}
                aria-label="Close gallery"
              >
                ×
              </button>
            </div>

            {partialResultsNote && <p className="maker-posts-partial-note">{partialResultsNote}</p>}

            {loadMoreError && (
              <div className="maker-posts-gallery-load-error" role="alert">
                <p>{loadMoreError}</p>
                <button
                  type="button"
                  className="maker-posts-dismiss-error"
                  onClick={onDismissLoadMoreError}
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="maker-posts-gallery-nav">
              <button
                type="button"
                className={`maker-posts-gallery-nav-btn${canGoPrevious ? '' : ' is-nav-hidden'}`}
                onClick={onPreviousPage}
                disabled={!canGoPrevious || isLoadingMore}
                aria-label="Previous posts"
                aria-hidden={!canGoPrevious}
                tabIndex={canGoPrevious ? 0 : -1}
              >
                ‹
              </button>

              <div
                className={`maker-posts-gallery-grid${isLoadingMore ? ' is-loading-more' : ''}`}
                aria-busy={isLoadingMore}
                aria-live="polite"
              >
                {posts.map((post) => (
                  <GalleryCell key={post.id} post={post} onPostClick={handlePostClick} />
                ))}
                {isLoadingMore &&
                  Array.from({ length: Math.max(0, 9 - posts.length) }).map((_, index) => (
                    <div
                      key={`loading-${index}`}
                      className="maker-posts-gallery-cell maker-posts-gallery-cell-skeleton"
                      aria-hidden="true"
                    />
                  ))}
              </div>

              <button
                type="button"
                className={`maker-posts-gallery-nav-btn${canGoNext || isLoadingMore ? '' : ' is-nav-hidden'}`}
                onClick={onNextPage}
                disabled={!canGoNext || isLoadingMore}
                aria-label="Load more posts"
                aria-busy={isLoadingMore}
                aria-hidden={!canGoNext && !isLoadingMore}
                tabIndex={canGoNext || isLoadingMore ? 0 : -1}
              >
                ›
              </button>
            </div>

            {(pageIndex > 0 || canGoNext || isLoadingMore) && (
              <p className="maker-posts-gallery-page-indicator" aria-live="polite">
                Page {pageIndex + 1}
                {isLoadingMore ? ' · Loading…' : ''}
              </p>
            )}

            <div className="maker-posts-gallery-footer">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="maker-posts-profile-link"
              >
                View full profile on X
              </a>
              <p className="maker-posts-attribution">
                Tap a tile to expand a post. Use the arrows to browse more posts.
              </p>
            </div>
          </div>
        </div>

        <ExpandedPostModal post={expandedPost} onClose={handleCloseExpandedPost} />
      </ModalPortal>
    );
  }
);

PostsGalleryModal.displayName = 'PostsGalleryModal';

export default PostsGalleryModal;
