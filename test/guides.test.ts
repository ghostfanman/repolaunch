import { describe, expect, it } from "vitest";
import { buildExport } from "@/core/report/export";
import { RULES } from "@/core/rules/definitions";
import { runAudit } from "@/core/rules/engine";
import { buildGuide, hasGuide, suggestTopics } from "@/core/rules/guides";
import { glossaryFor, scoreVerdict } from "@/core/report/plain";
import { cloneFixture, fixtureSnapshot, NOW, user } from "./helpers";

const allowedHost = (u: string) => ["github.com", "docs.github.com"].includes(new URL(u).hostname) && u.startsWith("https://");

describe("Anleitungen für Einsteiger", () => {
  it("jede Regel hat eine Anleitung in beiden Sprachen, Links nur auf GitHub", async () => {
    const snapshot = await fixtureSnapshot("web-app");
    for (const rule of RULES) {
      expect(hasGuide(rule.id), rule.id).toBe(true);
      for (const lang of ["de", "en"] as const) {
        const g = buildGuide(rule.id, { snapshot, lang, readmePath: "README.md", projectType: "webapp", manifests: [] })!;
        expect(g.action.length, rule.id).toBeGreaterThan(5);
        expect(g.steps.length, rule.id).toBeGreaterThan(0);
        for (const s of g.steps) if (s.link) expect(allowedHost(s.link.url), `${rule.id}: ${s.link.url}`).toBe(true);
        if (g.template?.createUrl) {
          expect(g.template.createUrl.length).toBeLessThanOrEqual(6000);
          const u = new URL(g.template.createUrl);
          expect(u.pathname).toBe("/repolaunch-fixtures/web-app/new/main");
          expect(u.searchParams.get("filename")).toBe(g.template.filename);
          expect(u.searchParams.get("value")).toBe(g.template.content);
          expect(g.template.createUrl).not.toMatch(/[()]/);
        }
        // Keine erfundenen Befehle: Vorlagen enthalten Platzhalter statt konkreter Installationsbefehle
        expect(g.template?.content ?? "").not.toMatch(/\b(npm|pip|cargo|brew) install\b/);
      }
    }
  });

  it("offene Aufgaben tragen Anleitung und Begründung; erfüllte Befunde keine", async () => {
    const a = runAudit(await fixtureSnapshot("web-app"), user("saas_customers"), { now: NOW });
    expect(a.tasks).toHaveLength(5);
    for (const t of a.tasks) {
      expect(t.guide?.steps.length).toBeGreaterThan(0);
      expect(t.why.length).toBeGreaterThan(20);
    }
    for (const f of a.findings.filter((x) => x.status !== "missing")) expect(f.guide).toBeUndefined();
  });

  it("README fehlt: Anleitung legt README.md mit Vorlage an, ohne erfundene Inhalte", async () => {
    const snap = await fixtureSnapshot("web-app", "users", cloneFixture("web-app", (f) => {
      f.readme = undefined as never;
      f.tree = f.tree.filter((e) => e.path !== "README.md");
    }));
    const a = runAudit(snap, user(), { now: NOW });
    const readme = a.findings.find((f) => f.ruleId === "understanding.readme")!;
    expect(readme.status).toBe("missing");
    expect(readme.guide?.template?.filename).toBe("README.md");
    expect(readme.guide?.template?.content).toContain("# web-app");
    expect(readme.guide?.template?.content).toContain("[Der genaue Befehl");
  });

  it("Topic-Vorschläge nur aus erkannten Daten, ohne vorhandene Topics", async () => {
    const snapshot = await fixtureSnapshot("cli-tool");
    const topics = suggestTopics({ snapshot, lang: "de", readmePath: null, projectType: "cli", manifests: [{ ecosystem: "npm", path: "package.json", name: "x", isPrivate: false, hasBin: true, binNames: ["x"], isLibrary: false, scripts: [], dependencies: ["typescript"], runtimeRequirement: null }] });
    expect(topics).toEqual(expect.arrayContaining(["command-line-tool", "javascript", "typescript"]));
    for (const t of snapshot.meta.topics) expect(topics).not.toContain(t);
  });

  it("Bericht beginnt mit verständlicher Kurzfassung und erklärt Begriffe", async () => {
    const snapshot = await fixtureSnapshot("web-app");
    const a = runAudit(snapshot, user("saas_customers"), { now: NOW });
    const md = buildExport(snapshot, a, user("saas_customers"), null).contents["audit.md"]!;
    const order = ["## Das Wichtigste in Kürze", "## Fünf priorisierte Aufgaben", "**So geht's:**", "## Begriffe kurz erklärt", "## Interner Bereitschaftsscore", "## Alle Befunde"].map((h) => md.indexOf(h));
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(md).toMatch(/\*\*36 von 100 Punkten\*\* \(Regelwerk `2026\.10\.\d+`\)\./);
    expect(md).toMatch(/`distribution\.funding`: nicht relevant\. .*Aktiv mit Ziel "Sponsoren", "Supportkunden"\./);
    expect(md).toContain("[README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)");
  });

  it("Einordnung des Scores in Worten, ohne Erfolgsversprechen", () => {
    expect(scoreVerdict(null, "de")).toContain("Nicht bewertbar");
    expect(scoreVerdict(10, "de")).toContain("Grundlagen");
    expect(scoreVerdict(95, "en")).toBe("Very well prepared.");
    for (const v of [0, 50, 80, 100]) expect(scoreVerdict(v, "de")).not.toMatch(/Erfolg|garantiert|Ranking/);
    expect(glossaryFor("Öffne die README und klicke Commit changes", "de").map((g) => g.term)).toEqual(["README", "Commit"]);
  });

  it("Website-Anleitung verweist nur dann auf eine Datei im Repository, wenn die Pages-Seite dazu gehört", async () => {
    const snapshot = await fixtureSnapshot("invoice-kit");
    const own = { ...snapshot, site: { state: "fetched" as const, url: "https://repolaunch-fixtures.github.io/invoice-kit/", finalUrl: "https://repolaunch-fixtures.github.io/invoice-kit/" } };
    const other = { ...snapshot, site: { state: "fetched" as const, url: "https://repolaunch-fixtures.github.io/other-project/", finalUrl: "https://repolaunch-fixtures.github.io/other-project/" } };
    const g1 = buildGuide("distribution.site_title", { snapshot: own, lang: "de", readmePath: "README.md", projectType: "webapp", manifests: [] })!;
    const g2 = buildGuide("distribution.site_title", { snapshot: other, lang: "de", readmePath: "README.md", projectType: "webapp", manifests: [] })!;
    expect(g1.steps[0]!.link?.url).toContain("/edit/main/index.html");
    expect(g2.steps[0]!.link).toBeUndefined();
    expect(g2.steps[0]!.text).toContain("Öffne die Startdatei deiner Website");
  });

  it("Glossar enthält keine kaputten Links", () => {
    const md = glossaryFor("eckigen Klammern", "de").map((g) => g.text).join(" ");
    expect(md).toContain("`[Text](Adresse)`");
  });
});
