export type SiteLocale = 'en' | 'zh' | 'ja';

export function detectBrowserLocale(
  languages: readonly string[] = typeof navigator !== 'undefined'
    ? navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    : ['en'],
): SiteLocale {
  for (const raw of languages) {
    const tag = raw.toLowerCase();
    if (tag.startsWith('zh')) {
      return 'zh';
    }
    if (tag.startsWith('ja')) {
      return 'ja';
    }
  }
  return 'en';
}
