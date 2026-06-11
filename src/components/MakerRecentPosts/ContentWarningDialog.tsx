import React, { memo, useCallback, useEffect, useId, useRef } from 'react';
import ModalPortal from './ModalPortal';
import { useModalBodyLock } from './useModalBodyLock';

interface ContentWarningDialogProps {
  open: boolean;
  makerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ContentWarningDialog: React.FC<ContentWarningDialogProps> = memo(
  ({ open, makerName, onConfirm, onCancel }) => {
    const titleId = useId();
    const confirmRef = useRef<HTMLButtonElement>(null);

    useModalBodyLock(open);

    useEffect(() => {
      if (!open) {
        return;
      }

      confirmRef.current?.focus();

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };

      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [open, onCancel]);

    const handleBackdropClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onCancel();
      },
      [onCancel]
    );

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
            aria-label="Cancel"
          />
          <div
            className="maker-posts-dialog maker-posts-consent"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="maker-posts-dialog-title">
              Content warning
            </h2>
            <div className="maker-posts-dialog-body">
              <p>
                Recent posts for makers are loaded from X (formerly Twitter). Kig.Wiki does not host or moderate this
                content.
              </p>
              <p>
                As these are their latest posts, there is a chance it could contain <strong>NSFW or otherwise questionable material</strong>.
                Only continue if you are comfortable and able to consent to viewing social media content as moderated by X.
              </p>
            </div>
            <div className="maker-posts-dialog-actions">
              <button type="button" className="maker-posts-btn maker-posts-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                className="maker-posts-btn maker-posts-btn-primary"
                onClick={onConfirm}
              >
                I consent, show posts
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }
);

ContentWarningDialog.displayName = 'ContentWarningDialog';

export default ContentWarningDialog;
