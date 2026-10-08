// Prüfschritt "Website": entscheidet, ob die Website aus dem Website-Feld abgerufen wird, und hält das
// Ergebnis als Teil des Schnappschusses fest. Nur bei Webprodukten, genau ein Abruf, Fehler werden zu "failed".

import { classifyProject } from "../analysis/classify";
import type { Localized, ProjectType, RepoSnapshot, SiteCheck } from "../types";
import { parseSiteHtml } from "./html";
import { isHtmlContentType, type SiteFetcher, type SiteFetchFailure } from "./types";

const L = (de: string, en: string): Localized => ({ de, en });

export const SITE_FAILURE_TEXT: Record<SiteFetchFailure, Localized> = {
  invalid_url: L("Adresse ist keine gültige http(s)-Adresse", "address is not a valid http(s) address"),
  blocked_address: L("Ziel ist eine private, lokale oder reservierte Adresse und wird aus Sicherheitsgründen nicht abgerufen", "target is a private, local or reserved address and is not fetched for security reasons"),
  dns_failed: L("Name der Website ließ sich nicht auflösen", "the website name could not be resolved"),
  timeout: L("Zeitlimit überschritten", "time limit exceeded"),
  too_many_redirects: L("mehr als drei Weiterleitungen", "more than three redirects"),
  bad_redirect: L("Weiterleitung auf ein ungültiges oder nicht erlaubtes Ziel", "redirect to an invalid or disallowed target"),
  too_large: L("Antwort größer als das Größenlimit", "response larger than the size limit"),
  unsupported_encoding: L("unbekannte Kodierung der Antwort", "unknown response encoding"),
  network_error: L("Verbindung fehlgeschlagen", "connection failed"),
};

function notChecked(skip: SiteCheck["skip"], url: string | null, reason: Localized): SiteCheck {
  return { state: "not_checked", url, skip, reason };
}

/**
 * Ruft die Website eines Webprodukts einmal lesend ab und wertet das HTML aus.
 * Ohne Fetcher (z. B. in Umgebungen ohne freigegebenen Netzzugang) bleibt die Prüfung "not_checked".
 */
export async function checkHomepage(snapshot: RepoSnapshot, projectTypeOverride: ProjectType | undefined, fetcher: SiteFetcher | null | undefined): Promise<SiteCheck> {
  if (classifyProject(snapshot, projectTypeOverride).used !== "webapp") {
    return notChecked("not_webapp", null, L("nur bei Webprodukten", "only for web products"));
  }
  const raw = snapshot.meta.homepage?.trim() ?? "";
  if (!raw) return notChecked("no_homepage", null, L("kein Website-Feld gesetzt", "no website field set"));
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return notChecked("invalid_homepage", null, L("Website-Feld enthält keine gültige http(s)-Adresse", "website field contains no valid http(s) address"));
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    return notChecked("invalid_homepage", null, L("Website-Feld enthält keine gültige http(s)-Adresse", "website field contains no valid http(s) address"));
  }
  const host = url.hostname.toLowerCase();
  if (host === "github.com" || host === "www.github.com") {
    return notChecked("github_homepage", url.toString(), L("Website-Feld zeigt auf GitHub selbst", "website field points to GitHub itself"));
  }
  if (!fetcher) return notChecked("disabled", url.toString(), L("Website-Prüfung in dieser Umgebung nicht aktiviert", "website check not enabled in this environment"));

  let result;
  try {
    result = await fetcher(url.toString());
  } catch {
    return { state: "failed", url: url.toString(), reason: SITE_FAILURE_TEXT.network_error };
  }
  if (!result.ok) return { state: "failed", url: url.toString(), reason: SITE_FAILURE_TEXT[result.failure], redirects: result.redirects };
  const html = isHtmlContentType(result.contentType);
  const ok = result.status >= 200 && result.status < 300;
  return {
    state: "fetched",
    url: url.toString(),
    finalUrl: result.finalUrl,
    status: result.status,
    contentType: result.contentType.slice(0, 200),
    bytes: result.bytes,
    redirects: result.redirects,
    html,
    facts: ok && html ? parseSiteHtml(result.body) : undefined,
  };
}
