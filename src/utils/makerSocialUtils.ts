// Shared utilities for social media and platform handling

// Constants for better maintainability
export const SOCIAL_ICON_PATHS = {
  TWITTER: '/social_icons/x.svg',
  INSTAGRAM: '/social_icons/instagram.svg',
  FACEBOOK: '/social_icons/facebook.svg',
  WEIBO: '/social_icons/weibo.svg',
  TIKTOK: '/social_icons/tiktok.svg',
  BLUESKY: '/social_icons/bluesky.svg',
} as const;

export const STATUS_COLORS = {
  OPEN: 'status-open',
  CLOSED: 'status-closed',
  WAITLIST: 'status-waitlist',
  UNKNOWN: 'status-unknown',
} as const;

export const SEARCH_DEBOUNCE_MS = 300;

// Helper function to validate URL
export const isValidUrl = (url: unknown): url is string => {
  return typeof url === 'string' && 
         url.trim() !== '' && 
         url !== 'null' && 
         url !== 'undefined' &&
         url.length > 0;
};

// Helper function to get icon path using switch statement
export const getIconPath = (platform: string): string | null => {
  const lowerPlatform = platform.toLowerCase();
  
  // Use switch statement for better readability and performance
  switch (true) {
    case lowerPlatform.includes('twitter') || lowerPlatform.includes('x.com'):
      return SOCIAL_ICON_PATHS.TWITTER;
    case lowerPlatform.includes('instagram'):
      return SOCIAL_ICON_PATHS.INSTAGRAM;
    case lowerPlatform.includes('facebook'):
      return SOCIAL_ICON_PATHS.FACEBOOK;
    case lowerPlatform.includes('weibo'):
      return SOCIAL_ICON_PATHS.WEIBO;
    case lowerPlatform.includes('tiktok'):
      return SOCIAL_ICON_PATHS.TIKTOK;
    case lowerPlatform.includes('bluesky'):
      return SOCIAL_ICON_PATHS.BLUESKY;
    default:
      return null; // No icon available
  }
};

// Helper function to get status color using switch statement
export const getStatusColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  
  switch (true) {
    case lowerStatus.includes('open') || lowerStatus.includes('active'):
      return STATUS_COLORS.OPEN;
    case lowerStatus.includes('closed') || lowerStatus.includes('inactive'):
      return STATUS_COLORS.CLOSED;
    case lowerStatus.includes('waitlist') || lowerStatus.includes('wait'):
      return STATUS_COLORS.WAITLIST;
    default:
      return STATUS_COLORS.UNKNOWN;
  }
};
