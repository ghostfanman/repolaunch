// Schnittstelle für den lesenden Abruf der Website eines Repositorys.
// Die Implementierung mit Netzwerkzugriff steht in fetch.ts, für Tests und Demo gibt es fixture.ts.

export type SiteFetchFailure =
  | "invalid_url"
  | "blocked_address"
  | "dns_failed"
  | "timeout"
  | "too_many_redirects"
  | "bad_redirect"
  | "unsupported_encoding"
  | "network_error";

export type SiteFetchResult =
  | {
      ok: true;
      requestedUrl: string;
      finalUrl: string;
      status: number;
      contentType: string;
      /** Content-Encoding der Antwort ("identity", "gzip", "deflate" oder "br"). */
      contentEncoding: string;
      /** Dekodierter Text, nur bei Status 2xx und HTML; sonst leer. */
      body: string;
      /** Größe des gelesenen Dokuments nach dem Entpacken, in Bytes. */
      documentBytes: number;
      /** Übertragene Bytes des Bodys (nach HTTP-Transferkodierung, vor dem Entpacken). */
      transferBytes: number;
      /** true, wenn das Dokument wegen des Größenlimits nur teilweise gelesen wurde. */
      truncated: boolean;
      redirects: string[];
      /** Gesendete HTTP-Anfragen; jede Weiterleitung zählt als eigener Abruf. */
      requests: number;
    }
  | { ok: false; requestedUrl: string; failure: SiteFetchFailure; redirects: string[]; requests: number };

/** Genau ein GET (plus höchstens die erlaubten Weiterleitungen) auf eine http(s)-Adresse. Wirft nie. */
export type SiteFetcher = (url: string) => Promise<SiteFetchResult>;

export function isHtmlContentType(contentType: string): boolean {
  return /^\s*(text\/html|application\/xhtml\+xml)\b/i.test(contentType);
}
