// Lesender Abruf der Website eines Repositorys: genau ein GET, höchstens drei Weiterleitungen,
// Zeit- und Größenlimit, eindeutiger User-Agent. Kein JavaScript, keine Unterseiten, keine Formulare.
//
// SSRF-Schutz: nur http und https, keine Zugangsdaten in der Adresse. Jede Adresse wird vor der
// Verbindung aufgelöst und geprüft (auch nach jeder Weiterleitung); die Verbindung nutzt genau die
// geprüfte IP (lookup-Hook), damit eine zweite DNS-Antwort (DNS-Rebinding) nichts ändert.
// Nur Bordmittel von Node.js, keine Abhängigkeiten.

import { lookup as dnsLookup } from "node:dns/promises";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import type { Transform } from "node:stream";
import { constants as zlibConstants, createBrotliDecompress, createGunzip, createInflate, createInflateRaw } from "node:zlib";
import { isPublicAddress } from "./address";
import { isHtmlContentType, type SiteFetcher, type SiteFetchFailure, type SiteFetchResult } from "./types";

export const SITE_USER_AGENT = "RepoLaunch-Website-Check/1 (+https://github.com/ghostfanman/repolaunch; one read-only GET per audit)";

export interface SiteFetchOptions {
  /** Gesamtzeit für Auflösung, Verbindung, Weiterleitungen und Lesen. */
  timeoutMs?: number;
  /**
   * Größenlimit in Bytes. Es gilt für das entpackte Dokument; darüber wird abgeschnitten und das Ergebnis als
   * unvollständig markiert. Zusätzlich ist die übertragene Menge auf denselben Wert begrenzt.
   */
  maxBytes?: number;
  maxRedirects?: number;
  /** Erlaubte Zieladressen. Standard: nur öffentliche Unicast-Adressen. */
  isAllowedAddress?: (ip: string) => boolean;
  /** Namensauflösung. Standard: Betriebssystem (dns.lookup, alle Adressen). */
  resolve?: (hostname: string) => Promise<{ address: string; family: number }[]>;
}

export const SITE_FETCH_DEFAULTS = { timeoutMs: 8_000, maxBytes: 1_000_000, maxRedirects: 3 } as const;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

class FetchFailure extends Error {
  constructor(readonly failure: SiteFetchFailure) {
    super(failure);
  }
}

const defaultResolve = async (hostname: string) => (await dnsLookup(hostname, { all: true, verbatim: true })).map((a) => ({ address: a.address, family: a.family }));

/** Bricht ein Versprechen ab, sobald das Signal auslöst (dns.lookup selbst ist nicht abbrechbar). */
function withSignal<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new FetchFailure("timeout"));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new FetchFailure("timeout"));
    signal.addEventListener("abort", onAbort, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      },
    );
  });
}

function sendRequest(url: URL, addresses: { address: string; family: number }[], signal: AbortSignal): Promise<IncomingMessage> {
  const mod = url.protocol === "https:" ? https : http;
  // Verbindung nur zu bereits geprüften Adressen; mit all: true (Happy Eyeballs) alle geprüften Adressen
  const pinned: LookupFunction = (_host, opts, cb) => {
    if (opts.all) cb(null, addresses.map((a) => ({ address: a.address, family: a.family })));
    else cb(null, addresses[0]!.address, addresses[0]!.family);
  };
  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: "GET",
        agent: false,
        signal,
        headers: {
          "User-Agent": SITE_USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "de,en;q=0.8",
        },
        lookup: pinned,
      },
      resolve,
    );
    req.on("error", reject);
    req.end();
  });
}

interface BodyRead {
  body: Buffer;
  transferBytes: number;
  truncated: boolean;
  /** Grund für ein unvollständiges Dokument: Größenlimit oder nicht dekodierbarer Rest der Antwort. */
  truncatedBy?: "limit" | "decode";
}

/** Entpacker, der auch bei leerem oder unvollständigem Strom ohne Fehler endet (Sync-Flush statt Finish). */
function makeDecoder(encoding: string, firstByte: number | undefined): Transform | null {
  if (encoding === "gzip" || encoding === "x-gzip") return createGunzip({ finishFlush: zlibConstants.Z_SYNC_FLUSH });
  if (encoding === "br") return createBrotliDecompress({ finishFlush: zlibConstants.BROTLI_OPERATION_FLUSH });
  // "deflate" kommt in der Praxis mit und ohne zlib-Kopf vor; ohne gültigen Kopf ist es rohes Deflate.
  const zlibHeader = firstByte !== undefined && (firstByte & 0x0f) === 8;
  return zlibHeader ? createInflate({ finishFlush: zlibConstants.Z_SYNC_FLUSH }) : createInflateRaw({ finishFlush: zlibConstants.Z_SYNC_FLUSH });
}

/**
 * Liest den Body gestreamt und entpackt ihn dabei. Das Limit gilt für die entpackten Bytes: Ist es erreicht,
 * wird abgeschnitten (truncated), Verbindung und Entpacker werden sofort beendet. Das schützt auch gegen stark
 * komprimierte Antworten. Die übertragene Menge ist zusätzlich begrenzt: Wird sie überschritten, endet der
 * Empfang, und der Entpacker verarbeitet noch, was schon empfangen wurde (bis zu einem Datenblock über dem Limit).
 */
function readBody(res: IncomingMessage, encoding: string, maxBytes: number, signal: AbortSignal): Promise<BodyRead> {
  if (!["identity", "gzip", "x-gzip", "deflate", "br"].includes(encoding)) {
    res.destroy();
    return Promise.reject(new FetchFailure("unsupported_encoding"));
  }
  const compressed = encoding !== "identity";
  return new Promise<BodyRead>((resolve, reject) => {
    let decoder: Transform | null = null;
    const chunks: Buffer[] = [];
    let size = 0;
    let transferBytes = 0;
    let truncatedBy: BodyRead["truncatedBy"];
    let settled = false;
    let resEnded = false;
    let transferCapped = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve({ body: Buffer.concat(chunks, size), transferBytes, truncated: truncatedBy !== undefined, ...(truncatedBy ? { truncatedBy } : {}) });
    };
    const fail = (failure: SiteFetchFailure) => {
      if (settled) return;
      settled = true;
      res.destroy();
      decoder?.destroy();
      reject(new FetchFailure(failure));
    };
    // Entpacktes Limit erreicht: sofort beenden
    const cut = () => {
      truncatedBy = "limit";
      done();
      res.destroy();
      decoder?.destroy();
    };
    const take = (chunk: Buffer) => {
      if (settled) return;
      const room = maxBytes - size;
      if (chunk.byteLength > room) {
        if (room > 0) {
          chunks.push(chunk.subarray(0, room));
          size += room;
        }
        cut();
        return;
      }
      chunks.push(chunk);
      size += chunk.byteLength;
    };
    const attachDecoder = (d: Transform) => {
      decoder = d;
      d.on("data", take);
      d.on("end", done);
      d.on("error", () => {
        // Beschädigte Daten (mit Sync-Flush endet ein bloß unvollständiger Strom ohne Fehler): Bereits Entpacktes
        // gilt als unvollständiges Dokument, ohne entpackte Daten ist die Antwort nicht lesbar.
        if (size > 0) {
          truncatedBy = "decode";
          done();
        } else fail("decode_error");
      });
    };
    res.on("data", (chunk: Buffer) => {
      if (settled || transferCapped) return;
      transferBytes += chunk.byteLength;
      if (compressed && !decoder) attachDecoder(makeDecoder(encoding, chunk[0]) as Transform);
      if (decoder) decoder.write(chunk);
      else take(chunk);
      if (!settled && transferBytes > maxBytes) {
        // Übertragungsgrenze: nicht mehr empfangen, aber Empfangenes noch entpacken
        transferCapped = true;
        truncatedBy = "limit";
        res.destroy();
        if (decoder) decoder.end();
        else done();
      }
    });
    res.on("end", () => {
      resEnded = true;
      if (decoder) decoder.end();
      else done();
    });
    res.on("error", () => {
      if (!transferCapped) fail(signal.aborted ? "timeout" : "network_error");
    });
    res.on("close", () => {
      if (!resEnded && !transferCapped) fail(signal.aborted ? "timeout" : "network_error");
    });
  });
}

/** Zeichensatz wie im HTML-Standard: BOM vor Header, Header vor meta; meta mit utf-16 bedeutet utf-8. */
function decodeText(body: Buffer, contentType: string): string {
  let label: string;
  if (body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) label = "utf-8";
  else if (body[0] === 0xfe && body[1] === 0xff) label = "utf-16be";
  else if (body[0] === 0xff && body[1] === 0xfe) label = "utf-16le";
  else {
    const fromHeader = contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1];
    let fromMeta = body.subarray(0, 2048).toString("latin1").match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1];
    if (fromMeta && /^utf-16/i.test(fromMeta)) fromMeta = "utf-8";
    label = (fromHeader ?? fromMeta ?? "utf-8").toLowerCase();
  }
  try {
    return new TextDecoder(label).decode(body).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("utf-8").decode(body).replace(/^\uFEFF/, "");
  }
}

export function createSiteFetcher(options: SiteFetchOptions = {}): SiteFetcher {
  const timeoutMs = options.timeoutMs ?? SITE_FETCH_DEFAULTS.timeoutMs;
  const maxBytes = options.maxBytes ?? SITE_FETCH_DEFAULTS.maxBytes;
  const maxRedirects = options.maxRedirects ?? SITE_FETCH_DEFAULTS.maxRedirects;
  const isAllowed = options.isAllowedAddress ?? isPublicAddress;
  const resolve = options.resolve ?? defaultResolve;

  return async (startUrl: string): Promise<SiteFetchResult> => {
    const redirects: string[] = [];
    let requests = 0;
    const signal = AbortSignal.timeout(timeoutMs);
    const fail = (failure: SiteFetchFailure): SiteFetchResult => ({ ok: false, requestedUrl: startUrl, failure, redirects, requests });
    let current = startUrl;
    try {
      for (let hop = 0; ; hop += 1) {
        let url: URL;
        try {
          url = new URL(current);
        } catch {
          return fail(hop === 0 ? "invalid_url" : "bad_redirect");
        }
        if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password || !url.hostname) {
          return fail(hop === 0 ? "invalid_url" : "bad_redirect");
        }

        // Adresse auflösen und prüfen, bevor eine Verbindung entsteht
        const host = url.hostname.replace(/^\[|\]$/g, "");
        let targets: { address: string; family: number }[];
        if (isIP(host)) {
          if (!isAllowed(host)) return fail("blocked_address");
          targets = [{ address: host, family: isIP(host) }];
        } else {
          let addresses: { address: string; family: number }[];
          try {
            addresses = await withSignal(resolve(host), signal);
          } catch (err) {
            return fail(err instanceof FetchFailure ? err.failure : "dns_failed");
          }
          if (addresses.length === 0) return fail("dns_failed");
          // Eine einzige nicht erlaubte Adresse reicht zur Ablehnung.
          if (addresses.some((a) => !isAllowed(a.address))) return fail("blocked_address");
          targets = addresses;
        }

        let res: IncomingMessage;
        requests += 1;
        try {
          res = await sendRequest(url, targets, signal);
        } catch {
          return fail(signal.aborted ? "timeout" : "network_error");
        }
        const status = res.statusCode ?? 0;

        if (REDIRECT_STATUSES.has(status)) {
          res.destroy();
          const location = res.headers.location;
          if (!location) return fail("bad_redirect");
          if (hop >= maxRedirects) return fail("too_many_redirects");
          try {
            current = new URL(location, url).toString();
          } catch {
            return fail("bad_redirect");
          }
          redirects.push(current);
          continue;
        }

        const contentType = String(res.headers["content-type"] ?? "");
        const contentEncoding = String(res.headers["content-encoding"] ?? "").trim().toLowerCase() || "identity";
        // Inhalt nur bei Erfolg und HTML lesen; sonst genügt der Statuscode.
        if (status < 200 || status >= 300 || !isHtmlContentType(contentType)) {
          res.destroy();
          return { ok: true, requestedUrl: startUrl, finalUrl: url.toString(), status, contentType, contentEncoding, body: "", documentBytes: 0, transferBytes: 0, truncated: false, redirects, requests };
        }
        let read: BodyRead;
        try {
          read = await readBody(res, contentEncoding, maxBytes, signal);
        } catch (err) {
          if (err instanceof FetchFailure) return fail(err.failure);
          return fail(signal.aborted ? "timeout" : "network_error");
        }
        return {
          ok: true,
          requestedUrl: startUrl,
          finalUrl: url.toString(),
          status,
          contentType,
          contentEncoding,
          body: decodeText(read.body, contentType),
          documentBytes: read.body.byteLength,
          transferBytes: read.transferBytes,
          truncated: read.truncated,
          ...(read.truncatedBy ? { truncatedBy: read.truncatedBy } : {}),
          redirects,
          requests,
        };
      }
    } catch (err) {
      if (err instanceof FetchFailure) return fail(err.failure);
      return fail(signal.aborted ? "timeout" : "network_error");
    }
  };
}
