import React, { memo, useCallback } from 'react';
import type { GalleryPost } from '../../types/fxTwitter';
import { useCachedMediaUrl } from './useCachedMediaUrl';

interface GalleryCellProps {
  post: GalleryPost;
  onPostClick?: (post: GalleryPost) => void;
}

const GalleryCell: React.FC<GalleryCellProps> = memo(({ post, onPostClick }) => {
  const isVideo = post.mediaType === 'video';
  const previewUrl = isVideo ? post.posterUrl : post.mediaUrl;
  const { src, isResolving, onMediaError } = useCachedMediaUrl(previewUrl ?? '');

  const handleClick = useCallback(() => {
    onPostClick?.(post);
  }, [post, onPostClick]);

  return (
    <button
      type="button"
      className={`maker-posts-gallery-cell${isResolving ? ' is-loading' : ''}`}
      onClick={handleClick}
      aria-label="Expand post"
    >
      {previewUrl ? (
        <img
          className="maker-posts-gallery-media"
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          onError={onMediaError}
          {...{ referrerPolicy: 'no-referrer' as const }}
        />
      ) : (
        <span className="maker-posts-gallery-placeholder" aria-hidden="true" />
      )}
      {isVideo && <span className="maker-posts-video-badge">Video</span>}
    </button>
  );
});

GalleryCell.displayName = 'GalleryCell';

export default GalleryCell;
