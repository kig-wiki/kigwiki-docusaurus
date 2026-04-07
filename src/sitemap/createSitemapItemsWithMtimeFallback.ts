import { promises as fsPromises } from 'fs';
import { flattenRoutes, normalizeUrl } from '@docusaurus/utils';
import { applyTrailingSlash } from '@docusaurus/utils-common';
import type { DocusaurusConfig, RouteConfig } from '@docusaurus/types';

type SitemapItem = {
  url: string;
  lastmod?: string | null;
  changefreq?: string | null;
  priority?: number | null;
};

export async function createSitemapItemsWithMtimeFallback(params: {
  defaultCreateSitemapItems: (p: typeof params) => Promise<SitemapItem[]>;
  routes: RouteConfig[];
  siteConfig: DocusaurusConfig;
}): Promise<SitemapItem[]> {
  const { defaultCreateSitemapItems, routes, siteConfig } = params;
  const items = await defaultCreateSitemapItems(params);

  function routeToUrl(route: RouteConfig) {
    return normalizeUrl([
      siteConfig.url,
      applyTrailingSlash(route.path, {
        trailingSlash: siteConfig.trailingSlash,
        baseUrl: siteConfig.baseUrl,
      }),
    ]);
  }

  const urlToMtimeMs = new Map<string, number>();
  for (const route of flattenRoutes(routes)) {
    const sourcePath = route.metadata?.sourceFilePath;
    if (typeof sourcePath !== 'string') continue;
    try {
      const st = await fsPromises.stat(sourcePath);
      const url = routeToUrl(route);
      const prev = urlToMtimeMs.get(url);
      if (prev === undefined || st.mtimeMs > prev) {
        urlToMtimeMs.set(url, st.mtimeMs);
      }
    } catch {
      // unreadable path
    }
  }

  const lastmodDay = (ms: number) => new Date(ms).toISOString().split('T')[0];

  return items.map((item) => {
    if (item.lastmod) return item;
    const ts = urlToMtimeMs.get(item.url);
    if (typeof ts !== 'number') return item;
    return { ...item, lastmod: lastmodDay(ts) };
  });
}
