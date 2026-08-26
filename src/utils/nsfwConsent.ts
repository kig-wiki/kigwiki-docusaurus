const storageKey = (makerName: string) =>
  `kigwiki-nsfw-warning:${makerName.trim().toLowerCase()}`;

export function hasNsfwConsent(makerName: string): boolean {
  if (typeof sessionStorage === 'undefined' || !makerName) {
    return false;
  }
  try {
    return sessionStorage.getItem(storageKey(makerName)) === '1';
  } catch {
    return false;
  }
}

export function setNsfwConsent(makerName: string): void {
  if (typeof sessionStorage === 'undefined' || !makerName) {
    return;
  }
  try {
    sessionStorage.setItem(storageKey(makerName), '1');
  } catch {
    // Private browsing or quota exceeded
  }
}
