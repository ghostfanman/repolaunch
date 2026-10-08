import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runAuditCli } from "@/cli/audit";
import { FakeProvider } from "@/core/ai/fake";
import { fixtureTransport } from "@/core/github/fixture-transport";
import { FIXTURE_REPOS } from "@/fixtures/repos";

const transport = fixtureTransport(FIXTURE_REPOS);
const quiet = () => {};

function env(over: Record<string, string> = {}) {
  return { INPUT_REPO: "https://github.com/repolaunch-fixtures/web-app", INPUT_GOAL: "saas_customers", INPUT_LANGUAGE: "de", OUTPUT_DIR: mkdtempSync(path.join(tmpdir(), "rl-cli-")), ...over };
}

describe("Audit ohne Server (GitHub Actions)", () => {
  it("erstellt Bericht und Dateien ohne KI", async () => {
    const e = env();
    const r = await runAuditCli(e, { transport, log: quiet });
    expect(r.exitCode).toBe(0);
    expect(r.files.sort()).toEqual(["audit.json", "audit.md", "launch-plan.md", "monetization-plan.md"]);
    expect(readdirSync(e.OUTPUT_DIR).sort()).toEqual(r.files.sort());
    expect(r.summary).toContain("**Artifacts**");
    expect(r.summary).toContain("Fünf priorisierte Aufgaben");
    expect(r.artifactName).toBe("repolaunch-repolaunch-fixtures-web-app-2222222");
    expect(JSON.parse(readFileSync(path.join(e.OUTPUT_DIR, "audit.json"), "utf8")).audit.tasks).toHaveLength(5);
  });

  it("übernimmt Projekttyp, Sprache und Nutzerangaben", async () => {
    const r = await runAuditCli(env({ INPUT_LANGUAGE: "en", INPUT_PROJECT_TYPE: "library", INPUT_AUDIENCE: "Small teams" }), { transport, log: quiet });
    expect(r.exitCode).toBe(0);
    expect(r.summary).toContain("Five prioritised tasks");
    expect(r.summary).toContain("set by user input");
    expect(r.summary).toContain("Small teams");
  });

  it.each([
    [{ INPUT_REPO: "https://evil.example/a/b" }, "Nur Adressen auf github.com"],
    [{ INPUT_GOAL: "money" }, "Unbekanntes Ziel"],
    [{ INPUT_PROJECT_TYPE: "rocket" }, "Unbekannter Projekttyp"],
    [{ INPUT_LANGUAGE: "fr" }, "Sprache muss de oder en sein"],
    [{ INPUT_AUDIENCE: "x".repeat(501) }, "höchstens 500"],
  ])("lehnt ungültige Eingaben ab: %o", async (over, text) => {
    const r = await runAuditCli(env(over), { transport, log: quiet });
    expect(r.exitCode).toBe(2);
    expect(r.summary).toContain(text);
    expect(r.files).toEqual([]);
  });

  it("meldet nicht gefundene oder private Repositories ehrlich", async () => {
    const r = await runAuditCli(env({ INPUT_REPO: "repolaunch-fixtures/nope" }), { transport, log: quiet });
    expect(r.exitCode).toBe(1);
    expect(r.summary).toContain("nicht gefunden oder nicht öffentlich");
  });

  it("KI gewählt ohne Schlüssel: Audit trotzdem vollständig, mit Hinweis", async () => {
    const r = await runAuditCli(env({ INPUT_AI_PACKAGE: "true" }), { transport, provider: null, log: quiet });
    expect(r.exitCode).toBe(0);
    expect(r.summary).toContain("ANTHROPIC_API_KEY");
    expect(r.files).not.toContain("README.suggested.md");
  });

  it("KI gewählt mit Anbieter: Offenlegung im Bericht, sechs Dateien", async () => {
    const r = await runAuditCli(env({ INPUT_AI_PACKAGE: "true" }), { transport, provider: new FakeProvider("ok"), log: quiet });
    expect(r.exitCode).toBe(0);
    expect(r.files.sort()).toEqual(["README.suggested.md", "audit.json", "audit.md", "launch-plan.md", "marketing-drafts.md", "monetization-plan.md"]);
    expect(r.summary).toContain("Diese ausgewählten öffentlichen Inhalte werden übermittelt");
  });

  it("KI-Fehler bricht den Audit nicht ab", async () => {
    const r = await runAuditCli(env({ INPUT_AI_PACKAGE: "true" }), { transport, provider: new FakeProvider("timeout"), log: quiet });
    expect(r.exitCode).toBe(0);
    expect(r.summary).toContain("KI-Entwürfe fehlgeschlagen");
    expect(r.files).toHaveLength(4);
  });

  it("KI nicht gewählt: Anbieter wird nicht aufgerufen", async () => {
    const fake = new FakeProvider("ok");
    await runAuditCli(env(), { transport, provider: fake, log: quiet });
    expect(fake.calls).toBe(0);
  });
});
