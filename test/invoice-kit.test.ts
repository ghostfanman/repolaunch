// Regressionsfall aus Issue #2 (ghostfanman/repolaunch): Audit von invoice-kit, Ziel "users", Webprodukt.
// Regelwerk 2026.10.0 ergab 79 Punkte (31 / 39) mit den Aufgaben visual_demo@1, security_policy, changelog,
// releases und contributing. Die Fixture bildet README, Dateiliste und Startseite nach; Abruf ohne Netzwerk.

import { describe, expect, it } from "vitest";
import { collectSnapshot } from "@/core/github/collector";
import { FIXTURE_OWNER, fixtureTransport } from "@/core/github/fixture-transport";
import { GitHubHttp } from "@/core/github/http";
import { DEFAULT_COLLECT_LIMITS } from "@/core/limits";
import { buildExport } from "@/core/report/export";
import { RULESET_VERSION } from "@/core/rules/config";
import { runAudit } from "@/core/rules/engine";
import { fixtureSiteFetcher } from "@/core/site/fixture";
import { FIXTURE_REPOS } from "@/fixtures/repos";
import { NOW, user } from "./helpers";

async function auditInvoiceKit() {
  const http = new GitHubHttp({ limits: DEFAULT_COLLECT_LIMITS, transport: fixtureTransport(FIXTURE_REPOS), sleep: async () => {} });
  const snapshot = await collectSnapshot(http, { owner: FIXTURE_OWNER, repo: "invoice-kit", goal: "users", source: "fixture" }, DEFAULT_COLLECT_LIMITS, () => NOW, {
    siteFetcher: fixtureSiteFetcher(FIXTURE_REPOS),
  });
  return { snapshot, audit: runAudit(snapshot, user("users"), { now: NOW }) };
}

const CONTRIBUTOR_ONLY = ["trust.contributing", "trust.releases", "trust.changelog", "trust.code_of_conduct", "distribution.contributor_entry"];

describe("Fall invoice-kit (Issue #2)", () => {
  it("Webprodukt, 9 GitHub-Anfragen, ein Website-Abruf, Regelwerk 2026.10.1", async () => {
    const { snapshot, audit } = await auditInvoiceKit();
    expect(audit.classification.used).toBe("webapp");
    expect(audit.rulesetVersion).toBe(RULESET_VERSION);
    expect(RULESET_VERSION).toBe("2026.10.1");
    expect(snapshot.stats.requests).toBe(9);
    expect(snapshot.site).toMatchObject({ state: "fetched", status: 200, url: "https://repolaunch-fixtures.github.io/invoice-kit/" });
  });

  it("erkennt den Live-Link in Zeile 5 als Demo: nur der Screenshot fehlt", async () => {
    const { audit } = await auditInvoiceKit();
    const demo = audit.findings.find((f) => f.ruleId === "usability.visual_demo")!;
    expect(demo).toMatchObject({ id: "usability.visual_demo@2", status: "missing", severity: "low", weight: 3, partialCredit: 2, variant: "screenshot_only" });
    expect(demo.evidence[0]).toMatchObject({ lines: [5, 5] });
    expect(demo.evidence[0]!.label).toContain("Zeile 5: https://repolaunch-fixtures.github.io/invoice-kit/");
    // Kein Widerspruch mehr: der nächste Schritt wertet dieselbe Zeile als Handlungslink
    const next = audit.findings.find((f) => f.ruleId === "distribution.next_step")!;
    expect(next.status).toBe("present");
    expect(next.evidence[0]!.lines).toEqual([5, 5]);
  });

  it("die fünf Aufgaben enthalten keine reinen Mitwirkenden-Aufgaben; die Sicherheitsrichtlinie bleibt", async () => {
    const { audit } = await auditInvoiceKit();
    expect(audit.tasks.map((t) => t.findingId)).toEqual([
      "trust.security_policy@1",
      "trust.site_privacy@1",
      "usability.visual_demo@2",
      "trust.site_imprint@1",
      "distribution.site_og_image@1",
    ]);
    for (const id of CONTRIBUTOR_ONLY) {
      expect(audit.tasks.some((t) => t.findingId.startsWith(`${id}@`)), id).toBe(false);
      expect(audit.findings.find((f) => f.ruleId === id)!.status, id).toBe("not_relevant");
    }
  });

  it("Website: Titel und Beschreibung vorhanden, Vorschaubild, Impressum und Datenschutz fehlen (Hinweis, keine Rechtsberatung)", async () => {
    const { audit } = await auditInvoiceKit();
    const f = (id: string) => audit.findings.find((x) => x.ruleId === id)!;
    expect(f("usability.site_reachable").status).toBe("present");
    expect(f("distribution.site_title").evidence[0]).toMatchObject({ lines: [6, 6], snippet: "Invoice Kit: E-Rechnung (XRechnung) & PDF-Rechnung kostenlos erstellen" });
    expect(f("distribution.site_description").status).toBe("present");
    expect(f("distribution.site_og_image").status).toBe("missing");
    expect(f("trust.site_imprint").status).toBe("missing");
    expect(f("trust.site_privacy").status).toBe("missing");
    expect(f("trust.site_privacy").evidence[0]!.label).toContain("ohne JavaScript, 5 Links");
    expect(f("trust.site_privacy").rationale).toContain("keine Rechtsberatung");
  });

  it("Score: 40 von 47 Gewichtspunkten = 85, Abdeckung vollständig", async () => {
    const { audit } = await auditInvoiceKit();
    expect(audit.score).toMatchObject({ value: 85, achievedWeight: 40, possibleWeight: 47, unknownWeight: 0, coverage: 1 });
    const scored = audit.findings.filter((f) => f.status === "present" || f.status === "missing");
    expect(scored.reduce((n, f) => n + (f.status === "present" ? f.weight : (f.partialCredit ?? 0)), 0)).toBe(40);
    expect(scored.reduce((n, f) => n + f.weight, 0)).toBe(47);
    expect(audit.score.formula).toContain("40 / 47");
  });

  it("der Bericht nennt die abgeschalteten Mitwirkenden-Regeln mit dem Ziel, das sie aktivieren würde", async () => {
    const { snapshot, audit } = await auditInvoiceKit();
    const md = buildExport(snapshot, audit, user("users"), null).contents["audit.md"]!;
    expect(md).toMatch(/`trust\.releases`: nicht relevant\. .*Aktiv mit Ziel "Mehr Mitwirkende", "Sponsoren", "Supportkunden", "SaaS-Kunden"\./);
    expect(md).toMatch(/`distribution\.commercial_offer`: nicht relevant\. .*Aktiv mit Ziel "Supportkunden", "SaaS-Kunden"\./);
    expect(md).toContain("teilweise erfüllt, angerechnet: 2 / 3");
  });
});
