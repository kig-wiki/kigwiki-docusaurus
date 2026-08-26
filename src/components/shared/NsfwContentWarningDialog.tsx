import React, { memo, useCallback, useEffect, useId, useRef } from 'react';
import ModalPortal from '../MakerRecentPosts/ModalPortal';
import { useModalBodyLock } from '../MakerRecentPosts/useModalBodyLock';

interface NsfwContentWarningDialogProps {
  open: boolean;
  makerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const NsfwContentWarningDialog: React.FC<NsfwContentWarningDialogProps> = memo(
  ({ open, makerName, onConfirm, onCancel }) => {
    const titleId = useId();
    const bodyId = useId();
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
        <div className="nsfw-warning-overlay">
          <button
            type="button"
            className="nsfw-warning-backdrop"
            onClick={handleBackdropClick}
            aria-label="Go back"
          />
          <div
            className="nsfw-warning-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
          >
            <h2 id={titleId} className="nsfw-warning-title">
              Content warning
            </h2>
            <p id={bodyId} className="nsfw-warning-body">
              {makerName}'s socials include some rather spicy NSFW content. Viewer discretion is advised.
            </p>
            <div className="nsfw-warning-actions">
              <button type="button" className="nsfw-warning-btn nsfw-warning-btn-secondary" onClick={onCancel}>
                Go back
              </button>
              <button
                ref={confirmRef}
                type="button"
                className="nsfw-warning-btn nsfw-warning-btn-primary"
                onClick={onConfirm}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }
);

NsfwContentWarningDialog.displayName = 'NsfwContentWarningDialog';

export default NsfwContentWarningDialog;
