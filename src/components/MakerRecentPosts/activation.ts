import type { ComponentType } from 'react';

export interface MakerRecentPostsProps {
  makerName: string;
  xProfileUrl: string;
}

type MakerRecentPostsComponent = ComponentType<MakerRecentPostsProps>;

let activated = false;
let modulePromise: Promise<{ default: MakerRecentPostsComponent }> | null = null;
let pageReadyPromise: Promise<void> | null = null;
let idleScheduled = false;
const activationListeners = new Set<() => void>();

export function isMakerRecentPostsActivated(): boolean {
  return activated;
}

export function subscribeMakerRecentPostsActivation(listener: () => void): () => void {
  if (activated) {
    listener();
    return () => {};
  }

  activationListeners.add(listener);
  return () => activationListeners.delete(listener);
}

function activate(): void {
  if (activated) {
    return;
  }

  activated = true;
  for (const listener of activationListeners) {
    listener();
  }
  activationListeners.clear();
}

function waitForPageReady(): Promise<void> {
  pageReadyPromise ??= new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    window.addEventListener('load', () => resolve(), { once: true });
  });

  return pageReadyPromise;
}

function scheduleIdleActivation(): void {
  if (idleScheduled) {
    return;
  }

  idleScheduled = true;

  void waitForPageReady().then(() => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => activate(), { timeout: 5000 });
    } else {
      window.setTimeout(() => activate(), 2000);
    }
  });
}

export function registerMakerRecentPostsSlot(element: HTMLElement): () => void {
  scheduleIdleActivation();

  let cancelled = false;
  let observer: IntersectionObserver | null = null;

  void waitForPageReady().then(() => {
    if (cancelled || activated) {
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          activate();
          observer?.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(element);
  });

  return () => {
    cancelled = true;
    observer?.disconnect();
  };
}

export function loadMakerRecentPostsModule(): Promise<{ default: MakerRecentPostsComponent }> {
  modulePromise ??= import(
    /* webpackChunkName: "maker-recent-posts" */
    './MakerRecentPostsRoot'
  );

  return modulePromise;
}

export function ensureMakerRecentPostsActivation(): void {
  activate();
}
