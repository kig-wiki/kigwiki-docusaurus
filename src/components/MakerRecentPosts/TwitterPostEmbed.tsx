import React, { memo, useEffect, useRef } from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const WIDGETS_SCRIPT = 'https://platform.x.com/widgets.js';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>;
      };
    };
  }
}

async function ensureTwitterWidgets(): Promise<void> {
  if (window.twttr?.widgets) {
    return;
  }

  const existing = document.querySelector(`script[src="${WIDGETS_SCRIPT}"]`);
  if (existing) {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (window.twttr?.widgets) {
          resolve();
          return;
        }
        window.setTimeout(check, 50);
      };
      check();
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGETS_SCRIPT;
    script.async = true;
    script.charset = 'utf-8';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load X widgets'));
    document.body.appendChild(script);
  });
}

interface TwitterPostEmbedProps {
  tweetUrl: string;
}

const TwitterPostEmbed: React.FC<TwitterPostEmbedProps> = memo(({ tweetUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();

  useEffect(() => {
    let cancelled = false;

    const renderEmbed = async () => {
      try {
        await ensureTwitterWidgets();
        if (cancelled || !containerRef.current) {
          return;
        }
        await window.twttr?.widgets.load(containerRef.current);
      } catch {
        // Embed script failed; the fallback link in the blockquote remains
      }
    };

    void renderEmbed();

    return () => {
      cancelled = true;
    };
  }, [tweetUrl, colorMode]);

  return (
    <div ref={containerRef} className="maker-posts-twitter-embed">
      <blockquote
        className="twitter-tweet"
        data-dnt="true"
        data-theme={colorMode}
        data-lang="en"
        data-conversation="none"
      >
        <p className="maker-posts-twitter-embed-loading" role="status">
          <span className="maker-posts-twitter-embed-spinner" aria-hidden="true" />
          <a href={tweetUrl}>Loading post from X…</a>
        </p>
      </blockquote>
    </div>
  );
});

TwitterPostEmbed.displayName = 'TwitterPostEmbed';

export default TwitterPostEmbed;
