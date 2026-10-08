// Schnittstelle für den lesenden Abruf der Website eines Repositorys.
// Die Implementierung mit Netzwerkzugriff steht in fetch.ts, für Tests und Demo gibt es fixture.ts.

export type SiteFetchFailure =
  | "invalid_url"
  | "blocked_address"
  | "dns_failed"
  | "timeout"
  | "too_many_redirects"
  | "bad_redirect"
  | "too_large"
  | "unsupported_encoding"
  | "network_error";

export type SiteFetchResult =
  | {
      ok: true;
      requestedUrl: string;
      finalUrl: string;
      status: number;
      contentType: string;
      /** Dekodierter Text, nur bei Status 2xx und HTML; sonst leer. */
      body: string;
      /** Gelesene Bytes (vor dem Entpacken). */
      bytes: number;
      redirects: string[];
    }
  | { ok: false; requestedUrl: string; failure: SiteFetchFailure; redirects: string[] };

/** Genau ein GET (plus höchstens die erlaubten Weiterleitungen) auf eine http(s)-Adresse. Wirft nie. */
export type SiteFetcher = (url: string) => Promise<SiteFetchResult>;

export function isHtmlContentType(contentType: string): boolean {
  return /^\s*(text\/html|application\/xhtml\+xml)\b/i.test(contentType);
}
