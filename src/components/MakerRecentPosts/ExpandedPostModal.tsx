import React, { memo, useCallback, useEffect, useId } from 'react';
import type { GalleryPost } from '../../types/fxTwitter';
import ModalPortal from './ModalPortal';
import TwitterPostEmbed from './TwitterPostEmbed';
import { useModalBodyLock } from './useModalBodyLock';

interface ExpandedPostModalProps {
  post: GalleryPost | null;
  onClose: () => void;
}

const ExpandedPostModal: React.FC<ExpandedPostModalProps> = memo(({ post, onClose }) => {
  const titleId = useId();

  useModalBodyLock(post !== null);

  useEffect(() => {
    if (!post) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [post, onClose]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onClose();
    },
    [onClose]
  );

  if (!post) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="maker-posts-overlay maker-posts-overlay-elevated">
        <button
          type="button"
          className="maker-posts-backdrop"
          onClick={handleBackdropClick}
          aria-label="Close post"
        />
        <div
          className="maker-posts-dialog maker-posts-post-expanded-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="maker-posts-gallery-header">
            <h2 id={titleId} className="maker-posts-dialog-title">
              Post on X
            </h2>
            <button
              type="button"
              className="maker-posts-close-btn"
              onClick={onClose}
              aria-label="Close post"
            >
              ×
            </button>
          </div>

          <TwitterPostEmbed key={post.id} tweetUrl={post.tweetUrl} />

          <div className="maker-posts-gallery-footer">
            <a
              href={post.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="maker-posts-profile-link"
            >
              Open post on X
            </a>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
});

ExpandedPostModal.displayName = 'ExpandedPostModal';

export default ExpandedPostModal;
