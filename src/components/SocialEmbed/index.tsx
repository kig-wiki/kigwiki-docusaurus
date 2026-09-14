import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
// Kig.wiki custom component used to embed social media posts into the page
// Twitter, Bluesky, TikTok, YouTube, and Instagram are supported
// Bluesky posts are resolved to DIDs at build time in the remark plugin /src/plugins/remark-social-embeds.ts
type Platform = 'twitter' | 'bluesky' | 'tiktok' | 'youtube' | 'instagram';

interface SocialEmbedProps {
  post: string;
  maxWidth?: number;
  did?: string; // Optional DID for Bluesky, will be injected at build time
}

type InstagramWindow = Window & {
  instgrm?: {
    Embeds: {
      process: () => void;
    };
  };
};

const INSTAGRAM_EMBED_SCRIPT = 'https://www.instagram.com/embed.js';

const parsePostUrl = (url: string): { platform: Platform; id: string } => {
  try {
    const urlObj = new URL(url);
    
    // Handle YouTube URLs
    if (urlObj.hostname === 'youtube.com' || urlObj.hostname === 'www.youtube.com') {
      const videoId = urlObj.searchParams.get('v');
      if (!videoId) throw new Error('Invalid YouTube URL format');
      return { platform: 'youtube', id: videoId };
    }
    
    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1); // Remove leading slash
      if (!videoId) throw new Error('Invalid YouTube short URL format');
      return { platform: 'youtube', id: videoId };
    }

    // Clean URL for other platforms
    const cleanUrl = url.trim()
      .replace(/^(https?:)?\/\//, 'https://')
      .replace(/\?.*$/, ''); // Remove query parameters only for non-YouTube URLs

    const cleanUrlObj = new URL(cleanUrl);
    const hostname = cleanUrlObj.hostname.replace(/^www\./, '');

    // Handle Twitter/X URLs
    if (hostname === 'twitter.com' || hostname === 'x.com') {
      const matches = cleanUrlObj.pathname.match(/\/\w+\/status\/(\d+)/);
      if (!matches) throw new Error('Invalid Twitter URL format');
      return { platform: 'twitter', id: matches[1] };
    }
    
    // Handle Bluesky URLs
    if (hostname === 'bsky.app') {
      const matches = cleanUrlObj.pathname.match(/\/profile\/([^/]+)\/post\/([^/]+)/);
      if (!matches) throw new Error('Invalid Bluesky URL format');
      return { platform: 'bluesky', id: `${matches[1]}/post/${matches[2]}` };
    }
    
    // Add TikTok URL parsing
    if (hostname === 'tiktok.com') {
      const matches = cleanUrlObj.pathname.match(/\/@([^/]+)\/video\/(\d+)/);
      if (!matches) throw new Error('Invalid TikTok URL format');
      return { platform: 'tiktok', id: `${matches[1]}/video/${matches[2]}` };
    }

    if (hostname === 'instagram.com' || hostname === 'instagr.am') {
      const matches = cleanUrlObj.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
      if (!matches) throw new Error('Invalid Instagram URL format');
      const kind = matches[1] === 'reels' ? 'reel' : matches[1];
      return { platform: 'instagram', id: `${kind}/${matches[2]}` };
    }
    
    throw new Error('Unsupported platform URL');
  } catch (error) {
    console.error('Error parsing social media URL:', error);
    throw error;
  }
};

const processInstagramEmbeds = () => {
  (window as InstagramWindow).instgrm?.Embeds?.process();
};

const loadInstagramEmbedScript = (): Promise<void> => {
  if ((window as InstagramWindow).instgrm?.Embeds?.process) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`script[src="${INSTAGRAM_EMBED_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Instagram embed script')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = INSTAGRAM_EMBED_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Instagram embed script'));
    document.body.appendChild(script);
  });
};

const InstagramEmbed: React.FC<{ permalink: string; maxWidth?: number }> = ({ permalink, maxWidth }) => {
  const { colorMode } = useColorMode();

  React.useEffect(() => {
    let cancelled = false;

    loadInstagramEmbedScript()
      .then(() => {
        if (cancelled) {
          return;
        }
        requestAnimationFrame(() => {
          if (!cancelled) {
            processInstagramEmbeds();
          }
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [permalink, colorMode]);

  return (
    <div
      style={{
        maxWidth: maxWidth || 540,
        width: '100%',
        margin: '10px 0',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: 3,
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: 540,
          minWidth: 0,
          padding: 0,
          width: 'calc(100% - 2px)',
        }}
      >
        <a href={permalink} target="_blank" rel="noopener noreferrer nofollow">
          View this post on Instagram
        </a>
      </blockquote>
    </div>
  );
};

const getTikTokVideoId = (id: string): string => {
  const parts = id.split('/video/');
  return parts[1] || id;
};

const TikTokEmbed: React.FC<{ id: string; maxWidth?: number }> = ({ id, maxWidth }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);
  const { colorMode } = useColorMode();
  const videoId = getTikTokVideoId(id);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || isInView) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true);
        }
      },
      { rootMargin: '100px 0px', threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isInView]);

  return (
    <div
      ref={containerRef}
      style={{
        maxWidth: maxWidth || 325,
        width: '100%',
        margin: '10px 0',
      }}
    >
      {isInView ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=0`}
          title="TikTok video"
          allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            width: '100%',
            aspectRatio: '9 / 16',
            border: 0,
            borderRadius: 8,
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '9 / 16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e1e4e8',
            borderRadius: 8,
            backgroundColor: colorMode === 'dark' ? '#1b1b1d' : '#f6f8fa',
          }}
        >
          TikTok video
        </div>
      )}
    </div>
  );
};

const YouTubeEmbed: React.FC<{ id: string; maxWidth?: number }> = ({ id, maxWidth }) => {
  return (
    <div style={{ 
      maxWidth: maxWidth || 605,
      width: '100%',
      margin: '10px 0',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%' /* 16:9 Aspect Ratio */
      }}>
        <iframe
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0
          }}
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
};

const LoadingPlaceholder: React.FC<{ platform: Platform; maxWidth?: number; colorMode: string }> = ({ platform, maxWidth, colorMode }) => (
  <div 
    style={{ 
      maxWidth: maxWidth || 605,
      width: '100%',
      height: platform === 'youtube' || platform === 'instagram' ? '340px' : '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e1e4e8',
      borderRadius: '6px',
      margin: '10px 0',
      backgroundColor: colorMode === 'dark' ? '#1b1b1d' : '#f6f8fa'
    }}
  >
    <div>Loading {platform} content...</div>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div 
    style={{ 
      color: 'red',
      padding: '1rem',
      border: '1px solid #ff0000',
      borderRadius: '4px',
      margin: '1rem 0'
    }}
  >
    {message}
  </div>
);

// Main component wrapper
const SocialEmbedContent: React.FC<SocialEmbedProps> = ({ post, maxWidth, did }) => {
  const { colorMode } = useColorMode();
  
  return (
    <React.Suspense fallback={<LoadingPlaceholder platform="twitter" maxWidth={maxWidth} colorMode={colorMode} />}>
      {(() => {
        let platform: Platform;
        let id: string;

        try {
          const parsed = parsePostUrl(post);
          platform = parsed.platform;
          id = parsed.id;
        } catch (error) {
          console.error('Error parsing social media URL:', error);
          return <ErrorDisplay message="Failed to parse social media URL" />;
        }

        return (
          <PlatformEmbed 
            platform={platform} 
            id={id} 
            maxWidth={maxWidth} 
            colorMode={colorMode}
            did={did}
          />
        );
      })()}
    </React.Suspense>
  );
};

// New wrapper component that uses BrowserOnly
const SocialEmbed: React.FC<SocialEmbedProps> = (props) => {
  return (
    <BrowserOnly fallback={<div>Loading social media embed...</div>}>
      {() => <SocialEmbedContent {...props} />}
    </BrowserOnly>
  );
};

const PlatformEmbed: React.FC<{
  platform: Platform;
  id: string;
  maxWidth?: number;
  colorMode: string;
  did?: string;
}> = ({ platform, id, maxWidth, colorMode, did }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadScript = async () => {
      const scriptSrc = platform === 'twitter' 
        ? 'https://platform.x.com/widgets.js'
        : platform === 'bluesky'
        ? 'https://embed.bsky.app/static/embed.js'
        : platform === 'instagram'
        ? INSTAGRAM_EMBED_SCRIPT
        : null;

      if (!scriptSrc) {
        setIsLoaded(true);
        return;
      }

      try {
        if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
          const script = document.createElement('script');
          script.src = scriptSrc;
          script.async = true;
          script.charset = 'utf-8';
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load ${platform} embed script:`, error);
      }
    };

    loadScript();
  }, [platform]);

  if (!isLoaded) {
    return <LoadingPlaceholder platform={platform} maxWidth={maxWidth} colorMode={colorMode} />;
  }

  // Platform specific renders
  if (platform === 'youtube') {
    return <YouTubeEmbed id={id} maxWidth={maxWidth} />;
  }

  if (platform === 'twitter') {
    return (
      <div style={{ maxWidth }}>
        <blockquote
          className="twitter-tweet"
          data-dnt="true"
          data-theme={colorMode}
          data-lang="en"
        >
          <a href={`https://twitter.com/i/status/${id}`}>Loading tweet...</a>
        </blockquote>
      </div>
    );
  }

  if (platform === 'bluesky') {
    const [handle, postId] = id.split('/post/');
    // Ensure the DID is properly formatted
    if (!did) {
      console.error('Missing DID for Bluesky post:', id);
      return <div>Error: Missing DID for Bluesky post</div>;
    }
    
    return (
      <div style={{ maxWidth }}>
        <blockquote 
          className="bluesky-embed"
          data-bluesky-uri={`at://${did}/app.bsky.feed.post/${postId}`}
          data-theme={colorMode}
        >
          <a 
            href={`https://bsky.app/profile/${handle}/post/${postId}`}
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            Loading Bluesky post...
          </a>
        </blockquote>
      </div>
    );
  }

  if (platform === 'tiktok') {
    return <TikTokEmbed id={id} maxWidth={maxWidth} />;
  }

  if (platform === 'instagram') {
    return (
      <InstagramEmbed
        permalink={`https://www.instagram.com/${id}/`}
        maxWidth={maxWidth}
      />
    );
  }

  throw new Error(`Unsupported platform: ${platform}`);
};

export default SocialEmbed; 