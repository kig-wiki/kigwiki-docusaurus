export function extractXHandle(url: string): string | null {
  try {
    const normalized = url.trim().replace(/^(https?:)?\/\//, 'https://');
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host !== 'x.com' && host !== 'twitter.com' && host !== 'www.x.com' && host !== 'www.twitter.com') {
      return null;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return null;
    }

    const handle = segments[0].replace(/^@/, '');
    if (!handle || handle === 'i' || handle === 'intent') {
      return null;
    }

    return handle;
  } catch {
    return null;
  }
}
