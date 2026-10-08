// Website-Prüfung: Adressschutz, Abruf gegen einen lokalen Testserver (nie das echte Netz), HTML-Auswertung und Regeln.

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requestLines } from "@/core/report/plain";
import { runAudit } from "@/core/rules/engine";
import { isPublicAddress } from "@/core/site/address";
import { checkHomepage } from "@/core/site/check";
import { createSiteFetcher, SITE_USER_AGENT } from "@/core/site/fetch";
import { fixtureSiteFetcher } from "@/core/site/fixture";
import { parseSiteHtml } from "@/core/site/html";
import { FIXTURE_REPOS } from "@/fixtures/repos";
import { cloneFixture, fixtureSnapshot, NOW, user } from "./helpers";

const PAGE = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Shiftboard &amp; Co: Schichtplanung</title>
<meta name="description" content="Schichten planen im Browser.">
<meta property="og:image" content="https://example.org/og.png">
</head>
<body>
<!-- <a href="/impressum">Impressum im Kommentar zählt nicht</a> -->
<a href="/app">App öffnen</a>
<footer><a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutzerklärung</a></footer>
</body>
</html>`;

// Kopfbereich vollständig, Rechtslinks erst nach viel Inhalt im Fußbereich
const LONG_PAGE = `<!DOCTYPE html>\n<html><head>\n<title>Lange Seite</title>\n</head>\n<body>\n${"<p>Inhalt</p>\n".repeat(2000)}<footer><a href="/impressum">Impressum</a> <a href="/datenschutz">Datenschutz</a></footer>\n</body></html>\n`;

let server: Server;
let base = "";
let hits: string[] = [];
let lastUserAgent = "";

beforeAll(async () => {
  server = createServer((req, res) => {
    hits.push(req.url ?? "");
    lastUserAgent = String(req.headers["user-agent"] ?? "");
    const url = req.url ?? "/";
    const port = (server.address() as AddressInfo).port;
    if (url === "/ok") return void res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE);
    if (url === "/gzip") return void res.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip" }).end(gzipSync(PAGE));
    if (url === "/notfound") return void res.writeHead(404, { "content-type": "text/html" }).end("<h1>404</h1>");
    if (url === "/pdf") return void res.writeHead(200, { "content-type": "application/pdf" }).end("%PDF-1.7");
    if (url.startsWith("/chain/")) {
      const n = Number(url.slice("/chain/".length));
      return void res.writeHead(302, { location: n > 0 ? `/chain/${n - 1}` : "/ok" }).end();
    }
    if (url === "/to-private") return void res.writeHead(302, { location: `http://intranet.test:${port}/ok` }).end();
    if (url === "/to-loopback") return void res.writeHead(301, { location: `http://127.0.0.2:${port}/ok` }).end();
    if (url === "/to-metadata") return void res.writeHead(307, { location: "http://169.254.169.254/latest/meta-data/" }).end();
    if (url === "/to-ipv6-loopback") return void res.writeHead(308, { location: `http://[::1]:${port}/ok` }).end();
    if (url === "/to-file") return void res.writeHead(302, { location: "file:///etc/passwd" }).end();
    if (url === "/slow") return; // antwortet nie
    if (url === "/big") return void res.writeHead(200, { "content-type": "text/html", "content-length": String(2_000_000) }).end("x".repeat(2_000_000));
    if (url === "/big-chunked") {
      res.writeHead(200, { "content-type": "text/html" });
      for (let i = 0; i < 40; i += 1) res.write("y".repeat(50_000));
      return void res.end();
    }
    if (url === "/gzip-bomb") return void res.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip" }).end(gzipSync(Buffer.alloc(5_000_000, 0x61)));
    if (url === "/long") return void res.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-encoding": "gzip" }).end(gzipSync(LONG_PAGE));
    res.writeHead(500).end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://site.test:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** Testnamen auflösen wie DNS; site.test zeigt auf den lokalen Testserver. */
const resolve = async (host: string) => {
  const table: Record<string, string[]> = { "site.test": ["127.0.0.1"], "intranet.test": ["10.1.2.3"], "mixed.test": ["93.184.216.34", "192.168.1.5"] };
  const list = table[host];
  if (!list) throw new Error("ENOTFOUND");
  return list.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));
};
// Echte Richtlinie, nur der lokale Testserver (genau 127.0.0.1) ist zusätzlich erlaubt.
const testPolicy = (ip: string) => ip === "127.0.0.1" || isPublicAddress(ip);
const fetcher = (over: Parameters<typeof createSiteFetcher>[0] = {}) => createSiteFetcher({ resolve, isAllowedAddress: testPolicy, timeoutMs: 2_000, maxBytes: 1_000_000, ...over });

describe("Adressschutz", () => {
  it.each([
    "127.0.0.1", "127.8.9.10", "10.0.0.1", "172.16.5.4", "172.31.255.255", "192.168.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "198.18.0.1",
    "224.0.0.1", "255.255.255.255", "192.0.2.10", "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1",
    "::ffff:10.0.0.1", "64:ff9b::a00:1", "2001:db8::1", "2002:a00:1::1", "2001:0:4136:e378::1", "fe80::1%eth0", "localhost", "", "999.1.1.1",
  ])("blockiert %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(["93.184.216.34", "185.199.108.153", "8.8.8.8", "172.32.0.1", "2606:4700:4700::1111", "2a00:1450:4001:80b::200e"])("erlaubt öffentliche Adresse %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });
});

describe("Abruf der Website", () => {
  it("liefert Status, Inhalt und Endadresse; eindeutiger User-Agent", async () => {
    const r = await fetcher()(`${base}/ok`);
    expect(r).toMatchObject({ ok: true, status: 200, finalUrl: `${base}/ok` });
    if (r.ok) expect(r.body).toContain("<title>");
    expect(lastUserAgent).toBe(SITE_USER_AGENT);
  });

  it("entpackt gzip", async () => {
    const r = await fetcher()(`${base}/gzip`);
    expect(r.ok && r.body.includes("Datenschutzerklärung")).toBe(true);
  });

  it("zählt Weiterleitungen als eigene Abrufe", async () => {
    const r = await fetcher()(`${base}/chain/2`);
    expect(r).toMatchObject({ ok: true, requests: 4, redirects: [`${base}/chain/1`, `${base}/chain/0`, `${base}/ok`] });
    const s = await fixtureSnapshot("web-app", "users", cloneFixture("web-app", (x) => (x.repo.homepage = `${base}/chain/2`)));
    s.site = await checkHomepage(s, undefined, fetcher());
    const lines = requestLines(s, "de");
    expect(lines[0]!.label).toBe("GitHub-API");
    expect(lines[1]).toEqual({ label: "Website", value: `4 Abrufe (davon 3 Weiterleitungen), ${Buffer.byteLength(PAGE)} B übertragen` });
    expect(requestLines(s, "en")[1]!.value).toBe(`4 fetches (3 of them redirects), ${Buffer.byteLength(PAGE)} B transferred`);
    // Gesperrte Adresse: keine Anfrage gesendet, daher keine Website-Zeile
    const blocked = await fetcher()(`${base}/to-private`);
    expect(blocked).toMatchObject({ ok: false, requests: 1 });
    expect(await createSiteFetcher()("http://127.0.0.1:1/")).toMatchObject({ ok: false, requests: 0 });
  });

  it("folgt höchstens drei Weiterleitungen", async () => {
    const three = await fetcher()(`${base}/chain/2`);
    expect(three).toMatchObject({ ok: true, status: 200 });
    expect(three.redirects).toHaveLength(3);
    const four = await fetcher()(`${base}/chain/3`);
    expect(four).toMatchObject({ ok: false, failure: "too_many_redirects" });
  });

  it.each([
    ["/to-private", "Name löst auf private Adresse auf"],
    ["/to-loopback", "IP-Literal Loopback"],
    ["/to-metadata", "Cloud-Metadaten"],
    ["/to-ipv6-loopback", "IPv6-Loopback"],
  ])("Weiterleitung auf eine private Adresse wird abgelehnt: %s (%s)", async (path) => {
    hits = [];
    const r = await fetcher()(`${base}${path}`);
    expect(r).toMatchObject({ ok: false, failure: "blocked_address" });
    expect(hits).toEqual([path]);
  });

  it("Weiterleitung auf ein anderes Schema wird abgelehnt", async () => {
    expect(await fetcher()(`${base}/to-file`)).toMatchObject({ ok: false, failure: "bad_redirect" });
  });

  it("mit der Standardrichtlinie keine Verbindung zu Loopback, auch nicht über DNS", async () => {
    hits = [];
    const port = (server.address() as AddressInfo).port;
    const strict = createSiteFetcher({ timeoutMs: 2_000 });
    expect(await strict(`http://127.0.0.1:${port}/ok`)).toMatchObject({ ok: false, failure: "blocked_address" });
    expect(await strict(`http://localhost:${port}/ok`)).toMatchObject({ ok: false, failure: "blocked_address" });
    expect(await createSiteFetcher({ resolve })(`http://mixed.test/`)).toMatchObject({ ok: false, failure: "blocked_address" });
    expect(hits).toEqual([]);
  });

  it.each(["ftp://site.test/", "file:///etc/passwd", "http://user:pw@site.test/", "javascript:alert(1)", "kein url"])("lehnt ungültige Startadresse ab: %s", async (u) => {
    expect(await fetcher()(u)).toMatchObject({ ok: false, failure: "invalid_url" });
  });

  it("Zeitlimit", async () => {
    const started = Date.now();
    const r = await fetcher({ timeoutMs: 300 })(`${base}/slow`);
    expect(r).toMatchObject({ ok: false, failure: "timeout" });
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it.each(["/big", "/big-chunked"])("Antwort über dem Limit wird abgeschnitten und markiert: %s", async (path) => {
    const r = await fetcher({ maxBytes: 1_000_000 })(`${base}${path}`);
    expect(r).toMatchObject({ ok: true, status: 200, truncated: true, documentBytes: 1_000_000, contentEncoding: "identity" });
    if (r.ok) expect(r.transferBytes).toBeLessThanOrEqual(1_100_000);
  });

  it("gzip-Bombe: das Limit gilt für die entpackten Bytes, übertragen wird wenig", async () => {
    const r = await fetcher({ maxBytes: 1_000_000 })(`${base}/gzip-bomb`);
    expect(r).toMatchObject({ ok: true, truncated: true, documentBytes: 1_000_000, contentEncoding: "gzip" });
    if (r.ok) expect(r.transferBytes).toBeLessThan(50_000);
  });

  it("komprimierte Antwort: entpackte Größe und Übertragungsgröße getrennt", async () => {
    const r = await fetcher()(`${base}/gzip`);
    expect(r).toMatchObject({ ok: true, contentEncoding: "gzip", truncated: false, documentBytes: Buffer.byteLength(PAGE), transferBytes: gzipSync(PAGE).byteLength });
    if (r.ok) expect(r.transferBytes).toBeLessThan(r.documentBytes);
  });

  it("nicht auflösbarer Name", async () => {
    expect(await fetcher()("http://unknown.test/")).toMatchObject({ ok: false, failure: "dns_failed" });
  });

  it("404 und Nicht-HTML liefern Status ohne Inhalt", async () => {
    expect(await fetcher()(`${base}/notfound`)).toMatchObject({ ok: true, status: 404, body: "" });
    expect(await fetcher()(`${base}/pdf`)).toMatchObject({ ok: true, status: 200, contentType: "application/pdf", body: "" });
  });
});

describe("HTML-Auswertung ohne JavaScript", () => {
  it("findet Titel, Beschreibung, Vorschaubild und Rechtslinks mit Zeilen", () => {
    const f = parseSiteHtml(PAGE);
    expect(f.title).toEqual({ text: "Shiftboard & Co: Schichtplanung", line: 5 });
    expect(f.description).toEqual({ text: "Schichten planen im Browser.", line: 6 });
    expect(f.ogImage).toEqual({ url: "https://example.org/og.png", line: 7 });
    expect(f.imprint).toMatchObject({ text: "Impressum", href: "/impressum.html", line: 12 });
    expect(f.privacy).toMatchObject({ text: "Datenschutzerklärung", href: "/datenschutz.html", line: 12 });
    expect(f.linkCount).toBe(3);
  });

  it("englische Begriffe, Ziel statt Text, mailto zählt nicht, Skripte und Kommentare werden ignoriert", () => {
    const f = parseSiteHtml(`<a href="/legal-notice">Legal</a><a href="mailto:privacy@example.org">Contact</a><a href="/policies/privacy">Policy</a><script>var a='<a href="/impressum">x</a>';</script>`);
    expect(f.imprint?.href).toBe("/legal-notice");
    expect(f.privacy?.href).toBe("/policies/privacy");
    expect(f.linkCount).toBe(3);
    expect(f.scriptCount).toBe(1);
    const none = parseSiteHtml(`<title> </title><meta name="description" content=""><a href="/imprint-page">Imprint</a>`);
    expect(none.title).toBeNull();
    expect(none.description).toBeNull();
    expect(none.imprint?.text).toBe("Imprint");
  });
});

describe("Website-Regeln", () => {
  const SITE = "https://shiftboard.example/";
  const withSite = (page: { status: number; contentType?: string; html?: string }, homepage = SITE) =>
    cloneFixture("web-app", (f) => {
      f.repo.homepage = homepage;
      f.site = { [SITE]: page };
    });
  async function audit(fixtures: ReturnType<typeof withSite>, siteFetch = fixtureSiteFetcher(fixtures)) {
    const s = await fixtureSnapshot("web-app", "users", fixtures);
    s.site = await checkHomepage(s, undefined, siteFetch);
    return runAudit(s, user("users"), { now: NOW });
  }
  const f = (a: ReturnType<typeof runAudit>, id: string) => a.findings.find((x) => x.ruleId === id)!;

  it("vollständige Seite: alle Website-Regeln erfüllt, mit Belegen aus dem HTML", async () => {
    const a = await audit(withSite({ status: 200, html: PAGE }));
    for (const id of ["usability.site_reachable", "distribution.site_title", "distribution.site_description", "distribution.site_og_image", "trust.site_imprint", "trust.site_privacy"]) {
      expect(f(a, id).status, id).toBe("present");
      expect(f(a, id).evidence.length, id).toBeGreaterThan(0);
    }
    expect(f(a, "distribution.site_title").evidence[0]).toMatchObject({ lines: [5, 5], snippet: "Shiftboard & Co: Schichtplanung", url: SITE });
    expect(f(a, "trust.site_privacy").rationale).toContain("Hinweis, keine Rechtsberatung");
    expect(f(a, "trust.site_imprint").rationale).toContain("Hinweis, keine Rechtsberatung");
  });

  it("fehlende Angaben sind Befunde mit Beleg; Impressum und Datenschutz als Hinweis ohne Rechtsberatung", async () => {
    const a = await audit(withSite({ status: 200, html: "<html><head><title>X</title></head><body><a href='/app'>App</a></body></html>" }));
    expect(f(a, "distribution.site_description")).toMatchObject({ status: "missing", severity: "medium" });
    expect(f(a, "distribution.site_og_image")).toMatchObject({ status: "missing", severity: "low" });
    expect(f(a, "trust.site_privacy")).toMatchObject({ status: "missing", severity: "medium" });
    expect(f(a, "trust.site_privacy").evidence[0]!.label).toContain("ohne JavaScript, 1 Links");
    expect(f(a, "trust.site_privacy").task).toContain("Im Zweifel rechtlich beraten lassen");
    expect(f(a, "trust.site_imprint").guide?.note).toContain("keine Rechtsberatung");
  });

  it("fehlgeschlagener Abruf ist unbekannt, nicht fehlend, und senkt nur die Abdeckung", async () => {
    const fixtures = withSite({ status: 200, html: PAGE });
    const failing = async (url: string) => ({ ok: false as const, requestedUrl: url, failure: "timeout" as const, redirects: [], requests: 1 });
    const a = await audit(fixtures, failing);
    const ok = await audit(fixtures);
    for (const id of ["usability.site_reachable", "distribution.site_title", "trust.site_privacy"]) expect(f(a, id).status, id).toBe("unknown");
    expect(f(a, "usability.site_reachable").evidence[0]!.label).toContain("Zeitlimit überschritten");
    expect(a.score.coverage).toBeLessThan(ok.score.coverage);
    // Unbekannt zählt nicht in den Score: ohne Website-Regeln bleibt das Verhältnis der übrigen Regeln
    const others = (x: typeof a) => x.findings.filter((y) => !y.ruleId.includes(".site_") && (y.status === "present" || y.status === "missing"));
    expect(a.score.possibleWeight).toBe(others(a).reduce((n, y) => n + y.weight, 0));
  });

  it("404 ist fehlend, 503 unbekannt; Inhaltsregeln bleiben unbekannt", async () => {
    const gone = await audit(withSite({ status: 404 }));
    expect(f(gone, "usability.site_reachable")).toMatchObject({ status: "missing", severity: "high" });
    expect(f(gone, "distribution.site_title").status).toBe("unknown");
    const down = await audit(withSite({ status: 503 }));
    expect(f(down, "usability.site_reachable").status).toBe("unknown");
  });

  it("Seite ohne Links, aber mit Skripten: Rechtslinks unbekannt statt fehlend", async () => {
    const a = await audit(withSite({ status: 200, html: "<html><head><title>App</title><script src='/main.js'></script></head><body><div id='root'></div></body></html>" }));
    expect(f(a, "trust.site_imprint").status).toBe("unknown");
    expect(f(a, "trust.site_privacy").status).toBe("unknown");
    expect(f(a, "distribution.site_title").status).toBe("present");
  });

  it("ohne Website-Feld, mit GitHub-Adresse oder ohne Fetcher wird nichts abgerufen", async () => {
    let calls = 0;
    const counting = async (url: string) => {
      calls += 1;
      return fixtureSiteFetcher(FIXTURE_REPOS)(url);
    };
    const none = await audit(withSite({ status: 200, html: PAGE }, ""), counting);
    expect(f(none, "usability.site_reachable").status).toBe("not_relevant");
    const gh = await audit(withSite({ status: 200, html: PAGE }, "https://github.com/repolaunch-fixtures/web-app"), counting);
    expect(f(gh, "trust.site_privacy").status).toBe("not_relevant");
    expect(calls).toBe(0);
    const s = await fixtureSnapshot("web-app", "users", withSite({ status: 200, html: PAGE }));
    expect((await checkHomepage(s, undefined, null)).skip).toBe("disabled");
    expect(f(runAudit({ ...s, site: await checkHomepage(s, undefined, null) }, user(), { now: NOW }), "distribution.site_title").status).toBe("unknown");
  });

  it("abgeschnittenes HTML: Kopfangaben sicher, Links im fehlenden Teil unbekannt, Beleg nennt das Abschneiden", async () => {
    const homepage = `${base}/long`;
    const s = await fixtureSnapshot("web-app", "users", cloneFixture("web-app", (x) => (x.repo.homepage = homepage)));
    s.site = await checkHomepage(s, undefined, fetcher({ maxBytes: 2_000 }));
    expect(s.site).toMatchObject({ state: "fetched", truncated: true, documentBytes: 2_000, contentEncoding: "gzip" });
    const a = runAudit(s, user("users"), { now: NOW });
    expect(f(a, "distribution.site_title").status).toBe("present");
    expect(f(a, "distribution.site_og_image").status).toBe("missing");
    for (const id of ["trust.site_imprint", "trust.site_privacy"]) {
      expect(f(a, id).status, id).toBe("unknown");
      expect(f(a, id).rationale, id).toContain("nach 2000 B abgeschnitten");
    }
    const ev = f(a, "usability.site_reachable").evidence[0]!;
    expect(ev.label).toContain("HTML abgeschnitten");
    expect(ev.snippet).toContain("Dokument (entpackt): 2000 B");
    expect(ev.snippet).toContain("Abgeschnitten: nur die ersten 2000 B gelesen");
    // Ohne Limit wird alles gelesen und die Links werden gefunden
    s.site = await checkHomepage(s, undefined, fetcher());
    const full = runAudit(s, user("users"), { now: NOW });
    expect(f(full, "trust.site_imprint").status).toBe("present");
    expect(full.findings.find((x) => x.ruleId === "usability.site_reachable")!.evidence[0]!.snippet).toMatch(/Dokument \(entpackt\): \d+ B\nÜbertragen \(gzip-komprimiert\): \d+ B/);
  });

  it("abgeschnitten im Kopfbereich: auch Titel und Beschreibung bleiben unbekannt", async () => {
    const s = await fixtureSnapshot("web-app", "users", cloneFixture("web-app", (x) => (x.repo.homepage = `${base}/long`)));
    s.site = await checkHomepage(s, undefined, fetcher({ maxBytes: 30 }));
    const a = runAudit(s, user("users"), { now: NOW });
    expect(f(a, "distribution.site_title").status).toBe("unknown");
    expect(f(a, "distribution.site_description").status).toBe("unknown");
  });

  it("ohne Website-Abruf (anderer Projekttyp, kein Website-Feld) nur die GitHub-Zeile", async () => {
    const cli = await fixtureSnapshot("cli-tool");
    expect(requestLines(cli, "de").map((r) => r.label)).toEqual(["GitHub-API"]);
    const noHome = await fixtureSnapshot("web-app");
    expect(noHome.site?.skip).toBe("no_homepage");
    expect(requestLines(noHome, "de")).toHaveLength(1);
  });

  it("nur Webprodukte: andere Projekttypen rufen keine Website ab und bewerten die Regeln nicht", async () => {
    let calls = 0;
    const counting = async (url: string) => {
      calls += 1;
      return { ok: false as const, requestedUrl: url, failure: "network_error" as const, redirects: [], requests: 1 };
    };
    const s = await fixtureSnapshot("cli-tool", "users", cloneFixture("cli-tool", (x) => (x.repo.homepage = "https://logtrim.example/")));
    expect((await checkHomepage(s, undefined, counting)).skip).toBe("not_webapp");
    expect(calls).toBe(0);
    const a = runAudit({ ...s, site: await checkHomepage(s, undefined, counting) }, user(), { now: NOW });
    expect(f(a, "trust.site_privacy")).toMatchObject({ status: "not_relevant", weight: 0 });
    // Projekttyp per Nutzerangabe: Webprodukt, dann wird geprüft
    expect((await checkHomepage(s, "webapp", counting)).state).toBe("failed");
    expect(calls).toBe(1);
  });
});
