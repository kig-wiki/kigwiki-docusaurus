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
  partialResultsNote: string | null;
  onClose: () => void;
}

const PostsGalleryModal: React.FC<PostsGalleryModalProps> = memo(
  ({ open, makerName, profileUrl, posts, partialResultsNote, onClose }) => {
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
        if (event.key === 'Escape' && !expandedPost) {
          onClose();
        }
      };

      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [open, onClose, expandedPost]);

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

            <div className="maker-posts-gallery-grid">
              {posts.map((post) => (
                <GalleryCell key={post.id} post={post} onPostClick={handlePostClick} />
              ))}
            </div>

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
                Tap a tile to expand a post.
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
