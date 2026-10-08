// Website-Abruf aus Fixtures für Tests und den gekennzeichneten Demo-Modus. Kein Netzwerkzugriff.

import type { FixtureRepo } from "../github/fixture-transport";
import { isHtmlContentType, type SiteFetcher, type SiteFetchResult } from "./types";

export function fixtureSiteFetcher(fixtures: FixtureRepo[], maxRedirects = 3): SiteFetcher {
  const pages = new Map<string, NonNullable<FixtureRepo["site"]>[string]>();
  for (const f of fixtures) for (const [url, page] of Object.entries(f.site ?? {})) pages.set(url, page);
  return async (startUrl): Promise<SiteFetchResult> => {
    const redirects: string[] = [];
    let current = startUrl;
    for (let hop = 0; ; hop += 1) {
      const page = pages.get(current);
      if (!page) return { ok: false, requestedUrl: startUrl, failure: "network_error", redirects };
      if (page.location) {
        if (hop >= maxRedirects) return { ok: false, requestedUrl: startUrl, failure: "too_many_redirects", redirects };
        current = new URL(page.location, current).toString();
        redirects.push(current);
        continue;
      }
      const contentType = page.contentType ?? "text/html; charset=utf-8";
      const body = page.status >= 200 && page.status < 300 && isHtmlContentType(contentType) ? (page.html ?? "") : "";
      return { ok: true, requestedUrl: startUrl, finalUrl: current, status: page.status, contentType, body, bytes: Buffer.byteLength(body), redirects };
    }
  };
}
