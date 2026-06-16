import React, { memo, useEffect, useRef, useState } from 'react';
import { isValidUrl } from '../../utils/makerSocialUtils';
import {
  ensureMakerRecentPostsActivation,
  isMakerRecentPostsActivated,
  loadMakerRecentPostsModule,
  registerMakerRecentPostsSlot,
  subscribeMakerRecentPostsActivation,
  type MakerRecentPostsProps,
} from './activation';

const MakerRecentPostsDeferred: React.FC<MakerRecentPostsProps> = (props) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const [Component, setComponent] = useState<React.ComponentType<MakerRecentPostsProps> | null>(
    null
  );

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) {
      return;
    }

    return registerMakerRecentPostsSlot(slot);
  }, []);

  useEffect(() => {
    if (!isMakerRecentPostsActivated()) {
      return subscribeMakerRecentPostsActivation(() => {
        void loadMakerRecentPostsModule().then((module) => {
          setComponent(() => module.default);
        });
      });
    }

    void loadMakerRecentPostsModule().then((module) => {
      setComponent(() => module.default);
    });
  }, []);

  if (!isValidUrl(props.xProfileUrl)) {
    return null;
  }

  return (
    <div
      ref={slotRef}
      className="maker-recent-posts-slot"
      onPointerEnter={ensureMakerRecentPostsActivation}
      onFocusCapture={ensureMakerRecentPostsActivation}
    >
      {Component ? <Component {...props} /> : null}
    </div>
  );
};

export default memo(MakerRecentPostsDeferred);
