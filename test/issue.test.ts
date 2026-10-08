import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORM_LABELS, githubIssueApi, ISSUE_LIMITS, isFormIssue, neutralizeGitHubRefs, parseIssueForm, runIssueAudit, truncateComment, type IssueApi, type RecentIssue } from "@/cli/issue";
import { fixtureTransport } from "@/core/github/fixture-transport";
import { GOALS, PROJECT_TYPES } from "@/core/types";
import { FIXTURE_REPOS } from "@/fixtures/repos";
import { cloneFixture } from "./helpers";

const quiet = () => {};
const NOW = new Date("2026-10-07T12:00:00Z");
const transport = fixtureTransport(FIXTURE_REPOS);

function body(o: { repo?: string; goal?: string; language?: string; type?: string; audience?: string; features?: string } = {}) {
  return [
    `### ${FORM_LABELS.repo}`,
    "",
    o.repo ?? "https://github.com/repolaunch-fixtures/web-app",
    "",
    `### ${FORM_LABELS.goal}`,
    "",
    o.goal ?? "saas_customers – SaaS-Kunden / SaaS customers",
    "",
    `### ${FORM_LABELS.language}`,
    "",
    o.language ?? "de – Deutsch",
    "",
    `### ${FORM_LABELS.projectType}`,
    "",
    o.type ?? "auto – automatisch erkennen / detect automatically",
    "",
    `### ${FORM_LABELS.audience}`,
    "",
    o.audience ?? "_No response_",
    "",
    `### ${FORM_LABELS.knownFeatures}`,
    "",
    o.features ?? "_No response_",
    "",
    "### Hinweis / Notice",
    "",
    "- [X] Mir ist bewusst, dass Anfrage und Bericht öffentlich sichtbar sind.",
  ].join("\n");
}

class FakeIssues implements IssueApi {
  comments: { n: number; body: string }[] = [];
  closed: { n: number; reason: string }[] = [];
  constructor(public recent: RecentIssue[] = []) {}
  async listRecentIssues() {
    return this.recent;
  }
  async comment(n: number, b: string) {
    this.comments.push({ n, body: b });
  }
  async close(n: number, reason: "completed" | "not_planned") {
    this.closed.push({ n, reason });
  }
}

function input(over: Partial<Parameters<typeof runIssueAudit>[0]> = {}) {
  return { issueNumber: 50, issueBody: body(), author: "alice", authorAssociation: "NONE", outputDir: mkdtempSync(path.join(tmpdir(), "rl-issue-")), runUrl: "https://github.com/ghostfanman/repolaunch/actions/runs/1", repository: "ghostfanman/repolaunch", ...over };
}

const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

describe("Issue-Formular", () => {
  it("liest alle Felder; leere Antworten werden leer", () => {
    expect(parseIssueForm(body({ audience: "Kleine Teams" }))).toEqual({
      repo: "https://github.com/repolaunch-fixtures/web-app",
      goal: "saas_customers – SaaS-Kunden / SaaS customers",
      language: "de – Deutsch",
      projectType: "auto – automatisch erkennen / detect automatically",
      audience: "Kleine Teams",
      knownFeatures: "",
    });
    expect(isFormIssue(body())).toBe(true);
    expect(isFormIssue("Hallo, ich habe eine Frage")).toBe(false);
  });

  it("Formularvorlage und Workflow passen zu den Überschriften im Code", () => {
    const tpl = readFileSync(".github/ISSUE_TEMPLATE/repolaunch-audit.yml", "utf8");
    const labels = [...tpl.matchAll(/^\s+label: "(.+)"$/gm)].map((x) => x[1]);
    for (const l of Object.values(FORM_LABELS)) expect(labels).toContain(l);
    const options = (id: string) => {
      const block = tpl.slice(tpl.indexOf(`id: ${id}\n`));
      const list = block.slice(block.indexOf("options:"), block.indexOf("default:"));
      return [...list.matchAll(/- "([a-z_]+) – /g)].map((x) => x[1]);
    };
    expect(options("goal")).toEqual([...GOALS]);
    expect(options("project_type")).toEqual(["auto", ...PROJECT_TYPES]);
    expect(options("language")).toEqual(["de", "en"]);
    const wf = readFileSync(".github/workflows/repolaunch-issue.yml", "utf8");
    expect(wf).toContain(`'### ${FORM_LABELS.repo}'`);
    expect(wf).toContain(`'### ${FORM_LABELS.goal}'`);
    expect(wf).not.toMatch(/ANTHROPIC|secrets\./);
    expect(wf).toMatch(/ISSUE_BODY: \$\{\{ github\.event\.issue\.body \}\}/);
    expect(wf).not.toMatch(/run:.*\$\{\{/);
  });
});

describe("Analyse per Issue", () => {
  it("schreibt den Bericht als Kommentar, schließt das Issue und nutzt keine KI", async () => {
    const api = new FakeIssues();
    const r = await runIssueAudit(input(), api, { transport, log: quiet, now: () => NOW });
    expect(r.exitCode).toBe(0);
    expect(api.comments).toHaveLength(1);
    expect(api.closed).toEqual([{ n: 50, reason: "completed" }]);
    const c = api.comments[0]!.body;
    expect(c).toContain("Das Wichtigste in Kürze");
    expect(c).toContain("So geht's");
    expect(c).toContain("[Workflow-Lauf](https://github.com/ghostfanman/repolaunch/actions/runs/1)");
    expect(c).toContain("https://github.com/ghostfanman/repolaunch/issues/new?template=repolaunch-audit.yml");
    expect(c).not.toContain("unten auf dieser Seite");
    expect(c).not.toContain("KI-Entwürfe");
    expect(c.length).toBeLessThan(65_536);
    expect(r.artifactName).toBe("repolaunch-repolaunch-fixtures-web-app-2222222");
  });

  it("liest häufige Kopierformen der Adresse und sagt das im Bericht", async () => {
    const api = new FakeIssues();
    await runIssueAudit(input({ issueBody: body({ repo: "github.com/repolaunch-fixtures/web-app/tree/main/src" }) }), api, { transport, log: quiet, now: () => NOW });
    expect(api.closed[0]!.reason).toBe("completed");
    expect(api.comments[0]!.body).toContain("als `repolaunch-fixtures/web-app` gelesen");
  });

  it("Bericht auf Englisch, wenn gewählt", async () => {
    const api = new FakeIssues();
    await runIssueAudit(input({ issueBody: body({ language: "en – English" }) }), api, { transport, log: quiet, now: () => NOW });
    expect(api.comments[0]!.body).toContain("How to do it");
    expect(api.comments[0]!.body).toContain("Created automatically by RepoLaunch");
  });

  it.each([
    [body({ repo: "https://evil.example/a/b" }), "Nur Adressen auf github.com"],
    [body({ repo: "_No response_" }), "Bitte ein Repository angeben"],
    [body({ goal: "money" }), "Unbekanntes Ziel"],
    [body({ repo: "repolaunch-fixtures/nope" }), "nicht gefunden oder nicht öffentlich"],
  ])("ungültige oder nicht lesbare Anfrage: verständliche Hilfe, geschlossen als nicht geplant (%#)", async (b, text) => {
    const api = new FakeIssues();
    const r = await runIssueAudit(input({ issueBody: b }), api, { transport, log: quiet, now: () => NOW });
    expect(r.exitCode).toBe(0);
    expect(api.comments[0]!.body).toContain(text);
    expect(api.comments[0]!.body).toContain("So klappt es beim nächsten Mal");
    expect(api.closed[0]!.reason).toBe("not_planned");
  });

  it("Grenze pro Person: frühere Formular-Issues der letzten Stunde zählen", async () => {
    const recent: RecentIssue[] = [
      { number: 40, createdAt: minutesAgo(50), author: "Alice", body: body() },
      { number: 41, createdAt: minutesAgo(30), author: "alice", body: body() },
      { number: 42, createdAt: minutesAgo(10), author: "alice", body: body() },
    ];
    let calls = 0;
    const counting: typeof transport = async (url, init) => {
      calls += 1;
      return transport(url, init);
    };
    const api = new FakeIssues(recent);
    await runIssueAudit(input(), api, { transport: counting, log: quiet, now: () => NOW });
    expect(api.comments[0]!.body).toContain("Limit erreicht");
    expect(api.closed[0]!.reason).toBe("not_planned");
    expect(calls).toBe(0);
  });

  it("nicht gezählt: ältere als eine Stunde, andere Issues, spätere Nummern; Verwalter ausgenommen", async () => {
    const recent: RecentIssue[] = [
      { number: 30, createdAt: minutesAgo(70), author: "alice", body: body() },
      { number: 41, createdAt: minutesAgo(30), author: "alice", body: "Frage zu RepoLaunch" },
      { number: 42, createdAt: minutesAgo(10), author: "alice", body: body() },
      { number: 51, createdAt: minutesAgo(1), author: "alice", body: body() },
      { number: 52, createdAt: minutesAgo(1), author: "alice", body: body() },
    ];
    const api = new FakeIssues(recent);
    await runIssueAudit(input(), api, { transport, log: quiet, now: () => NOW });
    expect(api.closed[0]!.reason).toBe("completed");

    const many = Array.from({ length: 5 }, (_, i) => ({ number: 40 + i, createdAt: minutesAgo(5), author: "ghostfanman", body: body() }));
    const owner = new FakeIssues(many);
    await runIssueAudit(input({ author: "ghostfanman", authorAssociation: "OWNER" }), owner, { transport, log: quiet, now: () => NOW });
    expect(owner.closed[0]!.reason).toBe("completed");
  });

  it("globale Grenze pro Stunde", async () => {
    const recent = Array.from({ length: ISSUE_LIMITS.globalPerHour }, (_, i) => ({ number: i + 1, createdAt: minutesAgo(20), author: `user${i}`, body: body() }));
    const api = new FakeIssues(recent);
    await runIssueAudit(input({ issueNumber: 100 }), api, { transport, log: quiet, now: () => NOW });
    expect(api.comments[0]!.body).toContain(`höchstens ${ISSUE_LIMITS.globalPerHour} Analysen`);
  });

  it("Erwähnungen und Querverweise aus Repository-Inhalten lösen keine Benachrichtigung aus", async () => {
    const fixtures = cloneFixture("web-app", (f) => {
      f.repo.description = "Shift planning by @someone and @acme/team, fixes #12, see https://github.com/other/repo/issues/7";
    });
    const api = new FakeIssues();
    await runIssueAudit(input(), api, { transport: fixtureTransport(fixtures), log: quiet, now: () => NOW });
    const c = api.comments[0]!.body;
    expect(c).not.toMatch(/(^|[^\w])@[A-Za-z0-9]/m);
    expect(c).not.toMatch(/#\d/);
    expect(c).not.toContain("github.com/other/repo/issues/7");
    expect(c).toContain("@⁠someone");
  });
});

describe("Bausteine", () => {
  it("neutralisiert Erwähnungen außerhalb von Codeblöcken", () => {
    const md = "Hallo @bob, siehe #3 und GH-4.\nMail: a@b.de\n```\n@keep #1\n```\nhttps://github.com/x/y/pull/9";
    const out = neutralizeGitHubRefs(md);
    expect(out).toContain("@⁠bob");
    expect(out).toContain("#⁠3");
    expect(out).toContain("GH⁠-4");
    expect(out).toContain("a@b.de");
    expect(out).toContain("```\n@keep #1\n```");
    expect(out).toContain("github.com⁠/x/y/pull/9");
  });

  it("kürzt lange Kommentare an einer Zeilengrenze und schließt offene Codeblöcke", () => {
    const md = `# Titel\n\n\`\`\`\n${"zeile\n".repeat(5000)}\`\`\`\n`;
    const out = truncateComment(md, "gekürzt", 2000);
    expect(out.length).toBeLessThanOrEqual(2000);
    expect(out.trimEnd().endsWith("> gekürzt")).toBe(true);
    expect((out.match(/^```/gm) ?? []).length % 2).toBe(0);
  });

  it("GitHub-Zugriff: feste Adressen, Pull Requests ausgefiltert, ungültiger Repository-Name abgelehnt", async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    const fake = (async (url: string, init: RequestInit = {}) => {
      calls.push({ url, method: init.method ?? "GET", body: init.body as string | undefined });
      if ((init.method ?? "GET") === "GET") {
        return new Response(JSON.stringify([{ number: 1, created_at: "x", user: { login: "a" }, body: "b" }, { number: 2, created_at: "x", user: { login: "a" }, body: "b", pull_request: {} }]), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const api = githubIssueApi("ghostfanman/repolaunch", "t0k", fake);
    expect(await api.listRecentIssues("2026-10-07T11:00:00.000Z")).toEqual([{ number: 1, createdAt: "x", author: "a", body: "b" }]);
    await api.comment(5, "hi");
    await api.close(5, "completed");
    expect(calls.map((c) => `${c.method} ${c.url.split("?")[0]}`)).toEqual([
      "GET https://api.github.com/repos/ghostfanman/repolaunch/issues",
      "POST https://api.github.com/repos/ghostfanman/repolaunch/issues/5/comments",
      "PATCH https://api.github.com/repos/ghostfanman/repolaunch/issues/5",
    ]);
    expect(JSON.parse(calls[2]!.body!)).toEqual({ state: "closed", state_reason: "completed" });
    expect(() => githubIssueApi("evil.com/x/../y", "t")).toThrow();
  });
});
