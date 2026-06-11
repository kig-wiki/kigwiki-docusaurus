import React, { memo } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { extractXHandle } from '../../utils/xHandleUtils';
import { isValidUrl } from '../../utils/makerSocialUtils';
import ContentWarningDialog from './ContentWarningDialog';
import PostsGalleryModal from './PostsGalleryModal';
import { useMakerRecentPosts } from './useMakerRecentPosts';

interface MakerRecentPostsProps {
  makerName: string;
  xProfileUrl: string;
}

const MakerRecentPostsContent: React.FC<MakerRecentPostsProps> = memo(({ makerName, xProfileUrl }) => {
  const handle = extractXHandle(xProfileUrl);
  const {
    state,
    posts,
    errorMessage,
    partialResultsNote,
    open,
    confirmConsent,
    cancelConsent,
    closeGallery,
    dismissError,
  } = useMakerRecentPosts(handle ?? '');

  if (!handle) {
    return null;
  }

  const isLoading = state === 'loading';

  return (
    <div className="maker-recent-posts">
      <button
        type="button"
        className="maker-posts-btn maker-posts-btn-secondary maker-posts-trigger"
        onClick={open}
        disabled={isLoading}
        aria-haspopup="dialog"
        aria-busy={isLoading}
      >
        {isLoading ? 'Loading posts…' : 'View recent posts'}
      </button>

      {state === 'error' && errorMessage && (
        <div className="maker-posts-inline-error" role="alert">
          <p>{errorMessage}</p>
          <p>
            <a href={xProfileUrl} target="_blank" rel="noopener noreferrer">
              Open @{handle} on X
            </a>
          </p>
          <button type="button" className="maker-posts-dismiss-error" onClick={dismissError}>
            Dismiss
          </button>
        </div>
      )}

      <ContentWarningDialog
        open={state === 'awaitingConsent'}
        makerName={makerName}
        onConfirm={confirmConsent}
        onCancel={cancelConsent}
      />

      <PostsGalleryModal
        open={state === 'gallery'}
        makerName={makerName}
        profileUrl={xProfileUrl}
        posts={posts}
        partialResultsNote={partialResultsNote}
        onClose={closeGallery}
      />
    </div>
  );
});

MakerRecentPostsContent.displayName = 'MakerRecentPostsContent';

const MakerRecentPosts: React.FC<MakerRecentPostsProps> = (props) => {
  if (!isValidUrl(props.xProfileUrl)) {
    return null;
  }

  return (
    <BrowserOnly fallback={null}>
      {() => <MakerRecentPostsContent {...props} />}
    </BrowserOnly>
  );
};

export default memo(MakerRecentPosts);
