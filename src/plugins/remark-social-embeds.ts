import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

// Type definitions
interface TikTokOEmbed {
  html: string;
  version: string;
  type: string;
  title: string;
  provider_name: string;
}

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: string;
}

interface MdxJsxFlowElement {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: MdxJsxAttribute[];
}

interface EmbedResolver {
  canHandle: (url: string) => boolean;
  resolve: (url: string) => Promise<{ name: string; value: string }>;
}

// Custom error types
class EmbedResolutionError extends Error {
  constructor(message: string, public readonly url: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'EmbedResolutionError';
  }
}

class DidResolutionError extends Error {
  constructor(message: string, public readonly handle: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DidResolutionError';
  }
}

// Simple rate limiter implementation
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private interval: number;
  
  constructor(interval = 100) { // 100ms between requests = max 10 requests per second
    this.interval = interval;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      
      if (timeSinceLastCall < this.interval) {
        await new Promise(resolve => setTimeout(resolve, this.interval - timeSinceLastCall));
      }
      
      const fn = this.queue.shift();
      if (fn) {
        this.lastCallTime = Date.now();
        await fn();
      }
    }
    
    this.processing = false;
  }
}

// Create rate limiter instance
const rateLimiter = new RateLimiter();

// URL parsing utilities
const parseBlueskyUrl = (url: string): string | null => {
  const match = url.match(/bsky\.app\/profile\/([\w.-]+)\/post\//);
  return match ? match[1] : null;
};

const isBlueskyUrl = (url: string): boolean => url.includes('bsky.app');
const isTikTokUrl = (url: string): boolean => url.includes('tiktok.com');

// DID resolution with improved error handling
const resolveDid = async (handle: string): Promise<string> => {
  console.log('Starting DID resolution for handle:', handle);
  
  return rateLimiter.add(async () => {
    try {
      const url = `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new DidResolutionError(
          `Failed to resolve DID: ${response.statusText}`,
          handle
        );
      }
      
      const data = await response.json();
      console.log('API Response:', { status: response.status, data });
      
      if (!data.did) {
        throw new DidResolutionError('No DID in response', handle);
      }
      
      console.log('Successfully resolved DID:', data.did);
      return data.did;
    } catch (error) {
      console.error('Error in resolveDid:', error);
      if (error instanceof DidResolutionError) {
        throw error;
      }
      throw new DidResolutionError(
        `Unexpected error resolving DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        handle,
        error instanceof Error ? error : undefined
      );
    }
  });
};

// TikTok embed resolver with improved error handling
const resolveTikTokEmbed = async (url: string): Promise<string> => {
  return rateLimiter.add(async () => {
    try {
      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      );
      
      if (!response.ok) {
        throw new EmbedResolutionError(
          `Failed to fetch TikTok embed: ${response.statusText}`,
          url
        );
      }
      
      const data: TikTokOEmbed = await response.json();
      return data.html;
    } catch (error) {
      if (error instanceof EmbedResolutionError) {
        throw error;
      }
      throw new EmbedResolutionError(
        `Unexpected error resolving TikTok embed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        url,
        error instanceof Error ? error : undefined
      );
    }
  });
};

// Embed resolvers registry using strategy pattern
const embedResolvers: EmbedResolver[] = [
  {
    canHandle: isBlueskyUrl,
    resolve: async (url: string) => {
      const handle = parseBlueskyUrl(url);
      if (!handle) {
        throw new EmbedResolutionError('Could not extract handle from Bluesky URL', url);
      }
      
      const did = await resolveDid(handle);
      return { name: 'did', value: did };
    }
  },
  {
    canHandle: isTikTokUrl,
    resolve: async (url: string) => {
      const html = await resolveTikTokEmbed(url);
      return { name: 'embedHtml', value: html };
    }
  }
];

// Helper function to find appropriate resolver
const findResolver = (url: string): EmbedResolver | null => {
  return embedResolvers.find(resolver => resolver.canHandle(url)) || null;
};

// Helper function to process a single embed
const processEmbed = async (node: MdxJsxFlowElement, postUrl: string): Promise<void> => {
  const resolver = findResolver(postUrl);
  
  if (!resolver) {
    console.warn(`No resolver found for URL: ${postUrl}`);
    return;
  }

  try {
    const { name, value } = await resolver.resolve(postUrl);
    
    node.attributes.push({
      type: 'mdxJsxAttribute',
      name,
      value,
    });
    
    console.log(`Successfully added ${name} attribute to node`);
  } catch (error) {
    console.error(`Error processing embed for URL ${postUrl}:`, error);
  }
};

// Helper function to extract post attribute
const getPostAttribute = (node: MdxJsxFlowElement): string | null => {
  const postAttr = node.attributes.find((attr: MdxJsxAttribute) => attr.name === 'post')?.value;
  return typeof postAttr === 'string' ? postAttr : null;
};

// Helper function to check if node is a SocialEmbed
const isSocialEmbed = (node: MdxJsxFlowElement): boolean => {
  return node.name === 'SocialEmbed' && Boolean(node.attributes);
};

const remarkSocialEmbeds: Plugin = () => {
  return async (tree) => {
    const promises: Promise<void>[] = [];

    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
      // Early return if not a SocialEmbed
      if (!isSocialEmbed(node)) {
        return;
      }

      const postUrl = getPostAttribute(node);
      
      // Early return if no post URL
      if (!postUrl) {
        console.warn('SocialEmbed node has no post attribute');
        return;
      }

      console.log('Processing SocialEmbed with post:', postUrl);
      
      promises.push(processEmbed(node, postUrl));
    });

    console.log('Waiting for all promises to resolve...');
    await Promise.all(promises);
    console.log('All promises resolved');
  };
};

export default remarkSocialEmbeds; 