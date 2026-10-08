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
      if (!page) return { ok: false, requestedUrl: startUrl, failure: "network_error", redirects, requests: hop + 1 };
      if (page.location) {
        if (hop >= maxRedirects) return { ok: false, requestedUrl: startUrl, failure: "too_many_redirects", redirects, requests: hop + 1 };
        current = new URL(page.location, current).toString();
        redirects.push(current);
        continue;
      }
      const contentType = page.contentType ?? "text/html; charset=utf-8";
      const body = page.status >= 200 && page.status < 300 && isHtmlContentType(contentType) ? (page.html ?? "") : "";
      const documentBytes = Buffer.byteLength(body);
      return {
        ok: true,
        requestedUrl: startUrl,
        finalUrl: current,
        status: page.status,
        contentType,
        contentEncoding: body ? (page.contentEncoding ?? "identity") : "identity",
        body,
        documentBytes,
        // Übertragungsgröße wie gemessen, falls angegeben; sonst unkomprimiert
        transferBytes: body ? (page.transferBytes ?? documentBytes) : 0,
        truncated: false,
        redirects,
        requests: hop + 1,
      };
    }
  };
}
