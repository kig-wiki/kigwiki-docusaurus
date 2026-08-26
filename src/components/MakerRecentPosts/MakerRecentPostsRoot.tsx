import React, { memo } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { extractXHandle } from '../../utils/xHandleUtils';
import { isValidUrl } from '../../utils/makerSocialUtils';
import ContentWarningDialog from './ContentWarningDialog';
import NsfwContentWarningDialog from '../shared/NsfwContentWarningDialog';
import PostsGalleryModal from './PostsGalleryModal';
import { useMakerRecentPosts } from './useMakerRecentPosts';
import { useNsfwContentWarning } from '../../hooks/useNsfwContentWarning';
import { setContentConsent } from '../../utils/fxTwitterCache';
import type { MakerRecentPostsProps } from './activation';
import '../../css/maker-recent-posts.css';

const MakerRecentPostsContent: React.FC<MakerRecentPostsProps> = memo(
  ({ makerName, xProfileUrl, contentWarning = false }) => {
    const handle = extractXHandle(xProfileUrl);
    const {
      state,
      posts,
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
    } = useMakerRecentPosts(handle ?? '');
    const {
      open: nsfwOpen,
      request: requestNsfw,
      confirm: confirmNsfw,
      cancel: cancelNsfw,
    } = useNsfwContentWarning(makerName, contentWarning);

    if (!handle) {
      return null;
    }

    const isLoading = state === 'loading';

    const handleOpen = () => {
      requestNsfw(() => {
        if (contentWarning) {
          setContentConsent();
        }
        open();
      });
    };

    return (
      <div className="maker-recent-posts">
        <button
          type="button"
          className="maker-posts-btn maker-posts-btn-secondary maker-posts-trigger"
          onClick={handleOpen}
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

        <NsfwContentWarningDialog
          open={nsfwOpen}
          makerName={makerName}
          onConfirm={confirmNsfw}
          onCancel={cancelNsfw}
        />

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
          pageIndex={pageIndex}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          isLoadingMore={isLoadingMore}
          loadMoreError={loadMoreError}
          partialResultsNote={partialResultsNote}
          onClose={closeGallery}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
          onDismissLoadMoreError={dismissLoadMoreError}
        />
      </div>
  );
});

MakerRecentPostsContent.displayName = 'MakerRecentPostsContent';

const MakerRecentPostsRoot: React.FC<MakerRecentPostsProps> = (props) => {
  if (!isValidUrl(props.xProfileUrl)) {
    return null;
  }

  return (
    <BrowserOnly fallback={null}>
      {() => <MakerRecentPostsContent {...props} />}
    </BrowserOnly>
  );
};

export default memo(MakerRecentPostsRoot);
