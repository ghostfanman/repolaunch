import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyProject } from "@/core/analysis/classify";
import { applyRuleOverrides, DEFAULT_RULE_CONFIG, effectiveWeight, RULESET_VERSION } from "@/core/rules/config";
import { RULES } from "@/core/rules/definitions";
import { compareTasks, openWeight, prioritize, runAudit } from "@/core/rules/engine";
import { GOALS, PROJECT_TYPES, type Category, type Finding, type Goal, type ProjectType, type RepoSnapshot } from "@/core/types";
import { cloneFixture, fixtureSnapshot, NOW, user } from "./helpers";

function finding(audit: ReturnType<typeof runAudit>, ruleId: string) {
  return audit.findings.find((f) => f.ruleId === ruleId)!;
}

function audit(s: RepoSnapshot, goal: Goal = "users", projectTypeOverride?: ProjectType) {
  return runAudit(s, { ...user(goal), projectTypeOverride }, { now: NOW });
}

describe("Projekttyp-Erkennung", () => {
  it.each([
    ["cli-tool", "cli"],
    ["web-app", "webapp"],
    ["library", "library"],
  ])("%s wird als %s erkannt, mit Begründungen", async (name, type) => {
    const c = classifyProject(await fixtureSnapshot(name));
    expect(c.detected).toBe(type);
    expect(c.signals.length).toBeGreaterThan(0);
  });

  it("übernimmt eine Nutzerangabe als Überschreibung und kennzeichnet sie", async () => {
    const c = classifyProject(await fixtureSnapshot("cli-tool"), "library");
    expect(c).toMatchObject({ detected: "cli", used: "library", overridden: true });
  });
});

describe("Projekttypabhängige Gewichtung", () => {
  it("fehlender Screenshot: bei CLI niedrig, bei Webprodukt hoch, bei Bibliothek nicht relevant", async () => {
    const noVisual = (name: string) =>
      cloneFixture(name, (f) => {
        f.readme = { path: "README.md", text: "# x\n\nNo images here at all, just a plain description of the project.\n" };
      });
    const cli = audit(await fixtureSnapshot("cli-tool", "users", noVisual("cli-tool")));
    const web = audit(await fixtureSnapshot("web-app", "users", noVisual("web-app")));
    const lib = audit(await fixtureSnapshot("library", "users", noVisual("library")));
    expect(finding(cli, "usability.visual_demo")).toMatchObject({ status: "missing", severity: "low" });
    expect(finding(web, "usability.visual_demo")).toMatchObject({ status: "missing", severity: "high" });
    expect(finding(lib, "usability.visual_demo")).toMatchObject({ status: "not_relevant", severity: "none" });
  });

  it("fehlender Zahlungslink wertet ehrenamtliche Projekte nicht ab", async () => {
    const s = await fixtureSnapshot("library");
    expect(finding(audit(s, "users"), "distribution.funding").status).toBe("not_relevant");
    expect(finding(audit(s, "contributors"), "distribution.funding").status).toBe("not_relevant");
    const sponsors = finding(audit(s, "sponsors"), "distribution.funding");
    expect(sponsors).toMatchObject({ status: "missing", severity: "high" });
  });

  it("Ziel steuert Relevanz von Angebot und Beitragsregeln", async () => {
    const s = await fixtureSnapshot("web-app");
    expect(finding(audit(s, "users"), "distribution.commercial_offer").status).toBe("not_relevant");
    expect(finding(audit(s, "saas_customers"), "distribution.commercial_offer").severity).toBe("high");
    expect(finding(audit(await fixtureSnapshot("cli-tool"), "users"), "trust.contributing").severity).toBe("low");
    expect(finding(audit(s, "users"), "trust.contributing").status).toBe("not_relevant");
    expect(finding(audit(s, "contributors"), "trust.contributing").severity).toBe("high");
  });

  it("Webprodukt mit Ziel Nutzer: Mitwirkenden-Regeln zählen nicht, die Sicherheitsrichtlinie schon", async () => {
    const a = audit(await fixtureSnapshot("web-app"), "users");
    for (const id of ["trust.contributing", "trust.releases", "trust.changelog", "trust.code_of_conduct", "distribution.contributor_entry"]) {
      expect(finding(a, id), id).toMatchObject({ status: "not_relevant", weight: 0 });
      expect(a.tasks.some((t) => t.findingId.startsWith(`${id}@`)), id).toBe(false);
    }
    expect(finding(a, "trust.security_policy")).toMatchObject({ status: "missing", weight: 2 });
    // Andere Ziele desselben Projekttyps bleiben unverändert
    expect(finding(audit(await fixtureSnapshot("web-app"), "saas_customers"), "trust.releases").weight).toBe(1);
  });

  it("feste Kombinationsgewichte ändern nur genau ihre Kombination", () => {
    const changed: string[] = [];
    for (const [id, cfg] of Object.entries(DEFAULT_RULE_CONFIG.rules)) {
      const additive = { ...cfg, comboWeights: undefined };
      for (const t of PROJECT_TYPES) for (const g of GOALS) if (effectiveWeight(cfg, t, g) !== effectiveWeight(additive, t, g)) changed.push(`${id}:${t}:${g}`);
    }
    expect(changed.sort()).toEqual(["trust.changelog:webapp:users", "trust.contributing:webapp:users", "trust.releases:webapp:users"]);
    const cfg = applyRuleOverrides(DEFAULT_RULE_CONFIG, { rules: { "trust.releases": { comboWeights: { webapp: { users: 2 }, cli: { sponsors: 0 } } } } });
    expect(effectiveWeight(cfg.rules["trust.releases"]!, "webapp", "users")).toBe(2);
    expect(effectiveWeight(cfg.rules["trust.releases"]!, "cli", "sponsors")).toBe(0);
    expect(effectiveWeight(cfg.rules["trust.releases"]!, "cli", "users")).toBe(3);
    expect(() => applyRuleOverrides(DEFAULT_RULE_CONFIG, { rules: { "trust.releases": { comboWeights: { webapp: { users: 4 } } } } })).toThrow();
    expect(() => applyRuleOverrides(DEFAULT_RULE_CONFIG, { rules: { "trust.releases": { comboWeights: { rocket: { users: 1 } } } } })).toThrow();
  });

  it("30-Tage-Plan: erstes oder nächstes Release richtet sich nach den Daten, auch wenn die Regel abgeschaltet ist", async () => {
    const a = audit(await fixtureSnapshot("web-app"), "users");
    expect(a.launchPlan.tasks.some((x) => x.title === "Erstes Release vorbereiten" && x.findingIds.length === 0)).toBe(true);
    const cli = audit(await fixtureSnapshot("cli-tool"), "users");
    expect(cli.launchPlan.tasks.some((x) => x.title === "Nächstes Release vorbereiten")).toBe(true);
  });

  it("Regelwerk ist versioniert und jede Regel konfiguriert", () => {
    expect(RULESET_VERSION).toMatch(/^\d{4}\.\d{1,2}\.\d+$/);
    for (const r of RULES) expect(DEFAULT_RULE_CONFIG.rules[r.id], r.id).toBeDefined();
  });

  it("Überschreibungen werden validiert und ändern die Version", async () => {
    const cfg = applyRuleOverrides(DEFAULT_RULE_CONFIG, { version: "team", rules: { "distribution.topics": { enabled: false }, "usability.visual_demo": { weights: { cli: 3 } } } });
    expect(cfg.version).toMatch(/^2026\.10\.2\+team\.[0-9a-f]{8}$/);
    const a = runAudit(await fixtureSnapshot("cli-tool"), user(), { config: cfg, now: NOW });
    expect(finding(a, "distribution.topics")).toMatchObject({ status: "not_relevant" });
    expect(finding(a, "usability.visual_demo").severity).toBe("high");
    expect(() => applyRuleOverrides(DEFAULT_RULE_CONFIG, { rules: { "unknown.rule": { enabled: false } } })).toThrow();
    expect(() => applyRuleOverrides(DEFAULT_RULE_CONFIG, { rules: { "distribution.topics": { weights: { cli: 9 } } } })).toThrow();
  });

  it("die mitgelieferte rules.example.json ist gültig", () => {
    const cfg = applyRuleOverrides(DEFAULT_RULE_CONFIG, JSON.parse(readFileSync("rules.example.json", "utf8")));
    expect(cfg.rules["trust.code_of_conduct"]!.enabled).toBe(false);
  });
});

describe("Befunde mit Belegen", () => {
  it("jeder Befund hat ID, Kategorie, Schwere, Evidenz, Begründung; fehlende auch Aufgabe, Aufwand, Hypothese", async () => {
    const a = audit(await fixtureSnapshot("web-app"));
    for (const f of a.findings.filter((x) => x.status === "missing")) {
      expect(f.id).toMatch(/^[a-z]+\.[a-z_]+@\d+$/);
      expect(f.evidence.length, f.id).toBeGreaterThan(0);
      expect(f.rationale.length).toBeGreaterThan(10);
      expect(f.task, f.id).toBeTruthy();
      expect(f.effort).toMatch(/bis/);
      expect(f.impactHypothesis).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(f.severity);
    }
  });

  it("README-Belege verweisen auf Datei, Zeilen und Commit", async () => {
    const a = audit(await fixtureSnapshot("cli-tool"));
    const ev = finding(a, "usability.quickstart").evidence[0]!;
    expect(ev).toMatchObject({ kind: "file", path: "README.md" });
    expect(ev.url).toContain(`/blob/${"1".repeat(40)}/README.md#L`);
    expect(ev.snippet).toContain("Installation");
  });

  it("liefert fünf priorisierte Aufgaben, sortiert nach Gewicht", async () => {
    const a = audit(await fixtureSnapshot("web-app", "saas_customers"), "saas_customers");
    expect(a.tasks).toHaveLength(5);
    const weights = a.tasks.map((t) => openWeight(a.findings.find((f) => f.id === t.findingId)!));
    expect([...weights].sort((x, y) => y - x)).toEqual(weights);
  });

  it("bündelt README-Aufgaben, wenn die README fehlt", async () => {
    const s = await fixtureSnapshot("cli-tool", "users", cloneFixture("cli-tool", (f) => delete f.readme));
    const a = audit(s);
    expect(finding(a, "understanding.readme").task).toContain("Enthalten sein sollten");
    expect(finding(a, "usability.quickstart")).toMatchObject({ status: "missing", task: null });
    expect(a.tasks.filter((t) => t.findingId.startsWith("usability.quickstart"))).toHaveLength(0);
  });
});

describe("Unbekannte Daten und Score", () => {
  it("unlesbare README führt zu unbekannt statt fehlt und senkt die Abdeckung", async () => {
    const s = await fixtureSnapshot("cli-tool");
    s.readme = { state: "unknown", path: "README.md", reason: { de: "Test", en: "test" } };
    const a = audit(s);
    expect(finding(a, "usability.quickstart").status).toBe("unknown");
    expect(a.score.coverage).toBeLessThan(1);
    expect(a.score.excluded.some((x) => x.ruleId === "usability.quickstart" && x.status === "unknown")).toBe(true);
  });

  it("Score entspricht der dokumentierten Formel", async () => {
    const a = audit(await fixtureSnapshot("cli-tool"));
    const scored = a.findings.filter((f) => f.status === "present" || f.status === "missing");
    const achieved = scored.reduce((n, f) => n + (f.status === "present" ? f.weight : (f.partialCredit ?? 0)), 0);
    const possible = scored.reduce((n, f) => n + f.weight, 0);
    expect(a.score.value).toBe(Math.round((achieved / possible) * 100));
    expect(a.score.formula).toContain(`${achieved} / ${possible}`);
  });

  it("Sterne beeinflussen weder Score noch Monetarisierung", async () => {
    const s = await fixtureSnapshot("library");
    const a1 = audit(s);
    s.display.stars = 999_999;
    const a2 = audit(s);
    expect(a2.score).toEqual(a1.score);
    expect(a2.monetization).toEqual(a1.monetization);
  });

  it("Monetarisierung: kein Geschäftsmodell nötig beim Ziel Nutzer, Lizenz ohne Rechtsberatung", async () => {
    const a = audit(await fixtureSnapshot("cli-tool"));
    expect(a.monetization.required).toBe(false);
    expect(a.monetization.licenseNote).toContain("Keine Rechtsberatung");
    expect(a.monetization.options.every((o) => o.priceHypothesis.includes("Testhypothese"))).toBe(true);
    expect(a.monetization.disclaimers.join(" ")).toContain("GitHub Sponsors setzt Teilnahmeberechtigung");
  });

  it("30-Tage-Plan hat höchstens zehn Aufgaben", async () => {
    const a = audit(await fixtureSnapshot("web-app"));
    expect(a.launchPlan.tasks.length).toBeLessThanOrEqual(10);
    expect(a.launchPlan.tasks.every((x) => x.week >= 1 && x.week <= 4)).toBe(true);
  });

  it("englischer Bericht enthält englische Texte", async () => {
    const a = runAudit(await fixtureSnapshot("web-app"), user("users", "en"), { now: NOW });
    expect(finding(a, "understanding.description").title).toBe("Meaningful repository description");
    expect(finding(a, "understanding.description").evidence[0]!.label).toBe("GitHub API: description");
    expect(a.score.formula).toMatch(/^Score = sum/);
  });
});

describe("Demo-Erkennung (usability.visual_demo@2)", () => {
  const web = (readme: string, homepage = "") =>
    cloneFixture("web-app", (f) => {
      f.repo.homepage = homepage;
      f.readme = { path: "README.md", text: readme };
    });
  const readme = (line: string) => `# Shiftboard\n\nShift planning for small teams, running in the browser without installation.\n\n${line}\n\n## Setup\n\nSee docs.\n`;

  it("README-Link auf das Website-Feld gilt als Demo: nur der Screenshot fehlt, Schwere sinkt", async () => {
    const a = audit(await fixtureSnapshot("web-app", "users", web(readme("[Open the app](http://Example.com/App)"), "https://example.com/app/")));
    const f = finding(a, "usability.visual_demo");
    expect(f.id).toBe("usability.visual_demo@2");
    expect(f).toMatchObject({ status: "missing", severity: "low", weight: 3, partialCredit: 2, variant: "screenshot_only" });
    expect(f.task).toContain("Screenshot");
    expect(f.task).not.toContain("Demo-Link in die README");
    expect(f.effortMinutes).toEqual([10, 20]);
    expect(f.evidence[0]).toMatchObject({ kind: "file", lines: [5, 5] });
    expect(f.evidence[0]!.label).toContain("Zeile 5: http://Example.com/App");
    expect(f.evidence[0]!.label).toContain("Website-Feld");
    expect(f.guide?.action).toBe("Screenshot in die README einfügen");
    expect(f.guide?.template).toBeUndefined();
  });

  it("Unterpfade der Homepage zählen, ähnliche Präfixe nicht", async () => {
    const sub = audit(await fixtureSnapshot("web-app", "users", web(readme("[Viewer](https://example.com/app/viewer.html?x=1#top)"), "https://example.com/app")));
    expect(finding(sub, "usability.visual_demo")).toMatchObject({ variant: "screenshot_only", severity: "low" });
    const other = audit(await fixtureSnapshot("web-app", "users", web(readme("[Open](https://example.com/application)"), "https://example.com/app")));
    expect(finding(other, "usability.visual_demo")).toMatchObject({ status: "missing", severity: "high" });
    expect(finding(other, "usability.visual_demo").variant).toBeUndefined();
  });

  it("GitHub Pages des Besitzers gilt als Demo, fremde Pages nicht", async () => {
    const own = audit(await fixtureSnapshot("web-app", "users", web(readme("[Start](https://repolaunch-fixtures.github.io/web-app/)"))));
    expect(finding(own, "usability.visual_demo")).toMatchObject({ variant: "screenshot_only" });
    expect(finding(own, "usability.visual_demo").evidence[0]!.label).toContain("GitHub Pages des Besitzers");
    const foreign = audit(await fixtureSnapshot("web-app", "users", web(readme("[Start](https://someone-else.github.io/web-app/)"))));
    expect(finding(foreign, "usability.visual_demo")).toMatchObject({ status: "missing", severity: "high" });
  });

  it("Bild oder Aufnahme bleibt erfüllt; ohne Demo und Bild bleibt die volle Schwere", async () => {
    const img = audit(await fixtureSnapshot("web-app", "users", web(readme("![Dashboard](docs/screen.png)"))));
    expect(finding(img, "usability.visual_demo").status).toBe("present");
    const video = audit(await fixtureSnapshot("web-app", "users", web(readme("[Walkthrough](https://youtu.be/abc123)"))));
    expect(finding(video, "usability.visual_demo").status).toBe("present");
    const none = audit(await fixtureSnapshot("web-app", "users", web(readme("Nothing to click here."))));
    expect(finding(none, "usability.visual_demo")).toMatchObject({ status: "missing", severity: "high" });
    expect(finding(none, "usability.visual_demo").partialCredit).toBeUndefined();
  });

  it("Demo-Erkennung und nächster Schritt werten dieselbe Zeile gleich", async () => {
    const a = audit(await fixtureSnapshot("web-app", "users", web(readme("[Generator öffnen](https://example.com/app/)"), "https://example.com/app/")));
    expect(finding(a, "distribution.next_step")).toMatchObject({ status: "present" });
    expect(finding(a, "distribution.next_step").evidence[0]!.lines).toEqual(finding(a, "usability.visual_demo").evidence[0]!.lines);
  });

  it("Teilgutschrift fließt in Score und Kategorie ein", async () => {
    const a = audit(await fixtureSnapshot("web-app", "users", web(readme("[Open](https://example.com/app)"), "https://example.com/app")));
    const usability = a.score.byCategory.find((c) => c.category === "usability")!;
    const expected = a.findings.filter((f) => f.category === "usability" && (f.status === "present" || f.status === "missing")).reduce((n, f) => n + (f.status === "present" ? f.weight : (f.partialCredit ?? 0)), 0);
    expect(usability.achieved).toBe(expected);
    expect(a.score.formula).toContain("Teilgutschriften");
  });
});

describe("Hinweis auf abgeschaltete Regeln", () => {
  it("nennt die Ziele, mit denen eine Regel bei gleichem Projekttyp aktiv würde", async () => {
    const a = audit(await fixtureSnapshot("web-app"), "users");
    const offer = finding(a, "distribution.commercial_offer");
    expect(offer.status).toBe("not_relevant");
    expect(offer.exclusionReason).toContain('Aktiv mit Ziel "Supportkunden", "SaaS-Kunden".');
    expect(offer.activeWith).toEqual({ goals: ["support_clients", "saas_customers"], projectTypes: [] });
    expect(finding(a, "trust.contributing").activeWith?.goals).toEqual(["contributors", "sponsors", "support_clients", "saas_customers"]);
    expect(finding(a, "distribution.funding").exclusionReason).toContain('Aktiv mit Ziel "Sponsoren", "Supportkunden".');
  });

  it("ohne passendes Ziel: nennt den Projekttyp", async () => {
    const a = audit(await fixtureSnapshot("web-app"), "users");
    expect(finding(a, "usability.cli_reference").exclusionReason).toContain('Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "CLI-Tool".');
    const cli = audit(await fixtureSnapshot("cli-tool"), "users");
    expect(finding(cli, "trust.site_privacy").activeWith).toEqual({ goals: [], projectTypes: ["webapp"] });
  });

  it("steht im Bericht unter \"Nicht bewertete Regeln\", auch auf Englisch", async () => {
    const s = await fixtureSnapshot("web-app");
    const en = runAudit(s, user("users", "en"), { now: NOW });
    expect(finding(en, "distribution.commercial_offer").exclusionReason).toContain('Active with goal "Support customers", "SaaS customers".');
    expect(en.score.excluded.find((x) => x.ruleId === "distribution.commercial_offer")!.reason).toContain("Active with goal");
  });

  it("per Konfiguration abgeschaltete Regeln bekommen keinen Hinweis", async () => {
    const cfg = applyRuleOverrides(DEFAULT_RULE_CONFIG, { rules: { "distribution.topics": { enabled: false } } });
    const a = runAudit(await fixtureSnapshot("web-app"), user(), { config: cfg, now: NOW });
    expect(finding(a, "distribution.topics").activeWith).toBeUndefined();
  });
});

describe("Reihenfolge der Aufgaben", () => {
  // Sortierung aus Regelwerk 2026.10.1, zum Vergleich für alle Projekttypen außer Webprodukt
  const ruleOrder = new Map(RULES.map((r, i) => [r.id, i]));
  const categories = ["understanding", "usability", "trust", "distribution"];
  const legacy = (findings: ReturnType<typeof audit>["findings"]) =>
    findings
      .filter((f) => f.status === "missing" && f.task && f.effortMinutes)
      .sort((a, b) => openWeight(b) - openWeight(a) || a.effortMinutes![0] - b.effortMinutes![0] || categories.indexOf(a.category) - categories.indexOf(b.category) || ruleOrder.get(a.ruleId)! - ruleOrder.get(b.ruleId)!)
      .slice(0, 5)
      .map((f) => f.id);

  it("andere Projekttypen behalten die bisherige Reihenfolge", async () => {
    for (const name of ["cli-tool", "library", "web-app"]) {
      for (const goal of GOALS) {
        for (const type of ["cli", "library", "template", "other"] as ProjectType[]) {
          const a = audit(await fixtureSnapshot(name, goal), goal, type);
          expect(a.tasks.map((t) => t.findingId), `${name} ${goal} ${type}`).toEqual(legacy(a.findings));
        }
      }
    }
  });

  it("ist deterministisch, unabhängig von der Eingabereihenfolge", async () => {
    const a = audit(await fixtureSnapshot("web-app", "saas_customers"), "saas_customers");
    const reversed = prioritize([...a.findings].reverse(), "webapp").map((t) => t.findingId);
    expect(reversed).toEqual(a.tasks.map((t) => t.findingId));
  });

  it("Webprodukt: bei gleicher Schwere zuerst Website-Befunde, Schwere bleibt erstes Kriterium", async () => {
    const f = (ruleId: string, severity: "high" | "medium" | "low", weight: number, category: Category): Finding => ({
      id: `${ruleId}@1`,
      ruleId,
      ruleVersion: 1,
      category,
      status: "missing",
      severity,
      weight,
      title: ruleId,
      evidence: [],
      rationale: "",
      task: "x",
      effort: "x",
      effortMinutes: [5, 10],
      impactHypothesis: "x",
    });
    const findings = [
      f("trust.security_policy", "medium", 2, "trust"),
      f("trust.site_privacy", "medium", 2, "trust"),
      f("understanding.description", "high", 3, "understanding"),
      f("distribution.site_og_image", "low", 1, "distribution"),
      f("usability.visual_demo", "low", 1, "usability"),
    ];
    expect(prioritize([...findings], "webapp").map((t) => t.findingId)).toEqual([
      "understanding.description@1",
      "trust.site_privacy@1",
      "trust.security_policy@1",
      "distribution.site_og_image@1",
      "usability.visual_demo@1",
    ]);
    // Ohne Webprodukt zählt die Gruppe nicht
    expect(prioritize([...findings], "cli").map((t) => t.findingId).slice(1, 3)).toEqual(["trust.security_policy@1", "trust.site_privacy@1"]);
    expect([...findings].sort(compareTasks("webapp"))[0]!.ruleId).toBe("understanding.description");
  });
});
