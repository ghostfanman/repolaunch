// Auswertung des ausgelieferten HTML mit Bordmitteln: Titel, Meta-Beschreibung, Open-Graph-Bild und
// Links zu Impressum und Datenschutz. Kein DOM, kein JavaScript; Inhalte von Kommentaren, script, style
// und template zählen nicht. Zeilennummern beziehen sich auf das HTML, damit Belege nachprüfbar sind.

import type { SiteFacts } from "../types";

const IMPRINT_RE = /(impressum|imprint|legal[\s_-]*notice)/i;
const PRIVACY_RE = /(datenschutz|privacy)/i;

/** Ersetzt den Inhalt eines Treffers durch Leerzeichen und behält Zeilenumbrüche; Positionen bleiben gleich. */
function mask(html: string, re: RegExp): string {
  return html.replace(re, (m) => m.replace(/[^\n]/g, " "));
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
  eacute: "é",
  copy: "©",
  middot: "·",
  ndash: "-",
  mdash: "-",
  hellip: "…",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[e] ?? m;
  });
}

function cleanText(s: string, max = 300): string {
  const t = decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)} …` : t;
}

/** Attribute eines Start-Tags; Namen klein geschrieben, Werte mit dekodierten Entities. */
export function parseAttributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const inner = tag.replace(/^<\s*[\w:-]+/, "").replace(/\/?>$/, "");
  for (const m of inner.matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) {
    const name = m[1]!.toLowerCase();
    if (!(name in out)) out[name] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

export function parseSiteHtml(raw: string): SiteFacts {
  const html = raw.replace(/\r\n?/g, "\n");
  const lineStarts = [0];
  for (let i = 0; i < html.length; i += 1) if (html[i] === "\n") lineStarts.push(i + 1);
  const lineAt = (index: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid]! <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const scriptCount = (html.match(/<script\b/gi) ?? []).length;
  let text = mask(html, /<!--[\s\S]*?(-->|$)/g);
  text = mask(text, /<(script|style|template)\b[\s\S]*?(<\/\1\s*>|$)/gi);

  let title: SiteFacts["title"] = null;
  const t = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(text);
  if (t) {
    const value = cleanText(t[1] ?? "");
    if (value) title = { text: value, line: lineAt(t.index) };
  }

  let description: SiteFacts["description"] = null;
  let ogImage: SiteFacts["ogImage"] = null;
  for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
    const a = parseAttributes(m[0]);
    const key = (a.name ?? a.property ?? "").toLowerCase();
    const content = (a.content ?? "").trim();
    if (!content) continue;
    if (!description && key === "description") description = { text: cleanText(content), line: lineAt(m.index!) };
    if (!ogImage && (key === "og:image" || key === "og:image:url" || key === "og:image:secure_url")) ogImage = { url: content.slice(0, 500), line: lineAt(m.index!) };
  }

  let imprint: SiteFacts["imprint"] = null;
  let privacy: SiteFacts["privacy"] = null;
  let linkCount = 0;
  for (const m of text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const a = parseAttributes(`<a ${m[1] ?? ""}>`);
    const href = (a.href ?? "").trim();
    if (!href) continue;
    linkCount += 1;
    // mailto, tel und javascript sind keine Seiten (z. B. privacy@... ist keine Datenschutzerklärung)
    if (/^(mailto|tel|javascript):/i.test(href)) continue;
    const label = cleanText(`${m[2] ?? ""} ${a["aria-label"] ?? ""} ${a.title ?? ""}`);
    const hay = `${label} ${href}`;
    const found = { text: label || href, href: href.slice(0, 500), line: lineAt(m.index!) };
    if (!imprint && IMPRINT_RE.test(hay)) imprint = found;
    if (!privacy && PRIVACY_RE.test(hay)) privacy = found;
  }

  return { title, description, ogImage, imprint, privacy, linkCount, scriptCount };
}
