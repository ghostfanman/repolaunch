// Audit für alle: Eine Person öffnet das Issue-Formular "Repository analysieren", der Workflow
// "RepoLaunch: Analyse per Issue" ruft diese Funktion auf, der Bericht kommt als Kommentar zurück.
// Der Issue-Text ist untrusted data: Er wird nur geparst und geprüft, nie ausgeführt.

import { runAuditCli, type CliDeps, type CliResult } from "@/cli/audit";
import { parseRepoInput, suggestRepoInput } from "@/core/repo-input";
import { GOALS, PROJECT_TYPES, type Goal, type Language, type PreviousAudit, type ProjectType } from "@/core/types";
import { t } from "@/i18n/messages";

/** Überschriften des Formulars (.github/ISSUE_TEMPLATE/repolaunch-audit.yml). Ein Test hält beide synchron. */
export const FORM_LABELS = {
  repo: "Repository",
  goal: "Ziel / Goal",
  language: "Berichtssprache / Report language",
  projectType: "Projekttyp / Project type",
  audience: "Zielgruppe / Audience (optional)",
  knownFeatures: "Bekannte Projektmerkmale / Known characteristics (optional)",
} as const;

export type FormField = keyof typeof FORM_LABELS;

/**
 * Grenzen gegen Missbrauch. Je Analyse höchstens 31 Anfragen mit dem Workflow-Token: 24 für die Erfassung,
 * 4 für frühere Berichte (Issue-Liste und bis zu drei Kommentarlisten), 3 für Grenzen, Kommentar und Schließen.
 * 30 Analysen × 31 = 930 bleiben unter dem Stundenlimit des Workflow-Tokens (1000).
 */
export const ISSUE_LIMITS = { perAuthorPerHour: 3, globalPerHour: 30 };

/** Wer das Repository verwaltet, ist von den Grenzen ausgenommen. */
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

/** GitHub lehnt Kommentare über 65 536 Zeichen ab. */
const MAX_COMMENT_CHARS = 60_000;

export interface RecentIssue {
  number: number;
  createdAt: string;
  author: string;
  body: string;
}

export interface IssueComment {
  author: string;
  authorType: string;
  body: string;
  createdAt: string;
}

export interface IssueApi {
  /** Issues (ohne Pull Requests), die seit dem Zeitpunkt aktualisiert wurden. */
  listRecentIssues(sinceIso: string): Promise<RecentIssue[]>;
  /** Die letzten 100 Issues (ohne Pull Requests), neueste zuerst; für die Suche nach früheren Berichten. */
  listIssues(): Promise<RecentIssue[]>;
  listComments(issueNumber: number): Promise<IssueComment[]>;
  comment(issueNumber: number, body: string): Promise<void>;
  close(issueNumber: number, reason: "completed" | "not_planned"): Promise<void>;
}

/** Schreibender Zugriff nur auf Issues dieses Repositories, nur über die feste GitHub-API. */
export function githubIssueApi(repository: string, token: string, fetchImpl: typeof fetch = fetch): IssueApi {
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(repository)) throw new Error("GITHUB_REPOSITORY ungültig");
  const base = `https://api.github.com/repos/${repository}/issues`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoLaunch-Issue-Audit",
  };
  async function call(url: string, init: RequestInit = {}): Promise<unknown> {
    const res = await fetchImpl(url, { ...init, headers: { ...headers, ...(init.body ? { "Content-Type": "application/json" } : {}) }, redirect: "error" });
    if (!res.ok) throw new Error(`GitHub-API ${init.method ?? "GET"} ${new URL(url).pathname} -> ${res.status}`);
    return res.json();
  }
  type RawIssue = { number: number; created_at: string; user: { login: string } | null; body: string | null; pull_request?: unknown };
  const toIssues = (data: RawIssue[]): RecentIssue[] =>
    data.filter((i) => !i.pull_request).map((i) => ({ number: i.number, createdAt: i.created_at, author: i.user?.login ?? "", body: i.body ?? "" }));
  return {
    async listRecentIssues(sinceIso) {
      return toIssues((await call(`${base}?state=all&since=${encodeURIComponent(sinceIso)}&per_page=100&sort=created&direction=desc`)) as RawIssue[]);
    },
    async listIssues() {
      return toIssues((await call(`${base}?state=all&per_page=100&sort=created&direction=desc`)) as RawIssue[]);
    },
    async listComments(issueNumber) {
      const data = (await call(`${base}/${issueNumber}/comments?per_page=30`)) as Array<{ user: { login: string; type: string } | null; body: string | null; created_at: string }>;
      return data.map((c) => ({ author: c.user?.login ?? "", authorType: c.user?.type ?? "", body: c.body ?? "", createdAt: c.created_at }));
    },
    async comment(issueNumber, body) {
      await call(`${base}/${issueNumber}/comments`, { method: "POST", body: JSON.stringify({ body }) });
    },
    async close(issueNumber, reason) {
      await call(`${base}/${issueNumber}`, { method: "PATCH", body: JSON.stringify({ state: "closed", state_reason: reason }) });
    },
  };
}

/** Liest die Felder aus dem Text, den GitHub aus dem Formular erzeugt ("### Überschrift" + Wert). */
export function parseIssueForm(body: string): Partial<Record<FormField, string>> {
  const sections = new Map<string, string>();
  const parts = body.replace(/\r\n?/g, "\n").split(/^### /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const value = nl === -1 ? "" : part.slice(nl + 1).trim();
    if (!sections.has(heading)) sections.set(heading, value === "_No response_" ? "" : value);
  }
  const out: Partial<Record<FormField, string>> = {};
  for (const [field, label] of Object.entries(FORM_LABELS) as Array<[FormField, string]>) {
    const v = sections.get(label);
    if (v !== undefined) out[field] = v;
  }
  return out;
}

/** Bei Auswahlfeldern zählt nur der Code am Anfang ("users – mehr Nutzer" -> "users"). */
function optionCode(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return v.trim().match(/^[a-z_]+/)?.[0] ?? v.trim();
}

/** Link auf das Formular, nur für ein gültiges owner/repo. */
export function newIssueUrl(repository: string | undefined): string | null {
  if (!repository || !/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(repository)) return null;
  return `https://github.com/${repository}/issues/new?template=repolaunch-audit.yml`;
}

/**
 * Vermerk am Ende eines Berichtskommentars, unsichtbar in der Darstellung, für spätere Vergleiche. Er zählt nur
 * als letzte Zeile: Repository-Inhalte oder Formulareingaben stehen nie dort, der Fuß und der Vermerk kommen
 * immer von RepoLaunch selbst.
 */
const MARKER_RE = /\n<!-- repolaunch-audit (\{[^\n]*\}) -->\s*$/;

/** So beginnt jeder erfolgreiche Bericht (auch vor Regelwerk 2026.10.2); Fehler- und Limitkommentare nicht. */
const REPORT_START_RE = /^> (Alle Dateien|All files) \(/;

/** Codeblöcke entfernen, damit zitierte Repository-Inhalte nicht als Berichtsangaben gelesen werden. */
function withoutCodeBlocks(md: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  for (const line of md.split("\n")) {
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const open = opensFence(line);
    if (open) {
      fence = open;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/** Öffnender Zaun nach CommonMark: mindestens drei ` oder ~; bei ` darf die Infozeile kein ` enthalten. */
function opensFence(line: string): string | null {
  const m = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
  if (!m) return null;
  if (m[1]![0] === "`" && m[2]!.includes("`")) return null;
  return m[1]!;
}

function closesFence(line: string, fence: string): boolean {
  const m = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
  return Boolean(m && m[1]![0] === fence[0] && m[1]!.length >= fence.length);
}

export function reportMarker(a: NonNullable<CliResult["audit"]>): string {
  return `<!-- repolaunch-audit ${JSON.stringify({ repo: a.fullName, ruleset: a.rulesetVersion, score: a.score, commit: a.commitSha, goal: a.goal, projectType: a.projectType, analyzedAt: a.analyzedAt })} -->`;
}

const VERSION_RE = /^\d{4}\.\d{1,2}\.\d+(\+[\w.-]+)?$/;

/**
 * Liest Repository, Regelwerk, Score und Commit aus einem früheren Berichtskommentar: zuerst aus dem Vermerk,
 * für Berichte vor Regelwerk 2026.10.2 aus dem sichtbaren Text. Liefert null, wenn etwas fehlt oder nicht passt.
 */
type ParsedReport = { fullName: string; rulesetVersion: string; score: number | null; commitSha: string | null; goal: Goal | null; projectType: ProjectType | null };

/** Rückübersetzung der Bezeichnungen aus dem sichtbaren Bericht (beide Sprachen) in Codes. */
function labelToCode<T extends string>(label: string | undefined, pick: (lang: Language) => Record<T, string>): T | null {
  if (!label) return null;
  const clean = label.split(" (")[0]!.trim();
  for (const lang of ["de", "en"] as const) {
    const hit = (Object.entries(pick(lang)) as Array<[T, string]>).find(([, v]) => v === clean);
    if (hit) return hit[0];
  }
  return null;
}

export function parseReportComment(raw: string): ParsedReport | null {
  const body = raw.replace(/\u2060/g, "").replace(/\r\n?/g, "\n");
  if (!REPORT_START_RE.test(body.trimStart())) return null;
  const marker = MARKER_RE.exec(body);
  if (marker) {
    try {
      const m = JSON.parse(marker[1]!) as { repo?: unknown; ruleset?: unknown; score?: unknown; commit?: unknown; goal?: unknown; projectType?: unknown };
      const ok =
        typeof m.repo === "string" &&
        /^[\w.-]+\/[\w.-]+$/.test(m.repo) &&
        typeof m.ruleset === "string" &&
        VERSION_RE.test(m.ruleset) &&
        (m.score === null || (typeof m.score === "number" && Number.isInteger(m.score) && m.score >= 0 && m.score <= 100)) &&
        (m.commit === undefined || m.commit === null || (typeof m.commit === "string" && /^[0-9a-f]{40}$/.test(m.commit)));
      if (ok) {
        return {
          fullName: m.repo as string,
          rulesetVersion: m.ruleset as string,
          score: m.score as number | null,
          commitSha: (m.commit as string | null | undefined) ?? null,
          goal: GOALS.includes(m.goal as Goal) ? (m.goal as Goal) : null,
          projectType: PROJECT_TYPES.includes(m.projectType as ProjectType) ? (m.projectType as ProjectType) : null,
        };
      }
    } catch {
      // Vermerk unlesbar: weiter mit dem sichtbaren Text
    }
  }
  // Berichte vor 2026.10.2: sichtbarer Text ohne Codeblöcke; der Score steht im Score-Abschnitt.
  const text = withoutCodeBlocks(body);
  const name = /^# RepoLaunch[- ]audit: (\S+)$/im.exec(text)?.[1]?.replace(/\\/g, "");
  const ruleset = /(?:Regelwerk|Ruleset):? (?:\*\*)?`([^`\s]+)`/.exec(text)?.[1];
  const scoreSection = text.split(/^## (?:Interner Bereitschaftsscore|Internal readiness score)\s*$/m)[1] ?? "";
  const score = /\*\*(\d{1,3}) \/ 100\*\*/.exec(scoreSection)?.[1];
  const commit = /(?:Analysierter Commit|Analysed commit|Analyzed commit): `([0-9a-f]{40})`/.exec(text)?.[1] ?? null;
  if (!name || !/^[\w.-]+\/[\w.-]+$/.test(name) || !ruleset || !VERSION_RE.test(ruleset)) return null;
  const value = score === undefined ? null : Number(score);
  const goal = labelToCode(/^- (?:Ziel|Goal): (.+)$/m.exec(text)?.[1], (l) => t(l).goals);
  const projectType = labelToCode(/^- (?:Projekttyp|Project type): (.+)$/m.exec(text)?.[1], (l) => t(l).projectTypes);
  return { fullName: name, rulesetVersion: ruleset, score: value !== null && value <= 100 ? value : null, commitSha: commit, goal, projectType };
}

/** Erfassungsfehler, die an der angefragten Adresse liegen; alle anderen gelten als vorübergehender Fehler des Dienstes. */
const INPUT_LIKE_ERRORS = new Set(["not_found_or_private", "private_unsupported", "empty_repository"]);

/** Bot, unter dem der Workflow mit GITHUB_TOKEN kommentiert. Nur dessen Berichte zählen als Beleg. */
const REPORT_AUTHOR = "github-actions[bot]";

/**
 * Sucht den letzten belegten Bericht zum selben Repository in früheren Formular-Issues (neueste zuerst,
 * höchstens drei Kommentarabrufe). Ohne Fund: undefined. Es wird nichts geschätzt oder ergänzt.
 */
export async function findPreviousAudit(api: IssueApi, target: string, currentIssue: number, repository: string | undefined): Promise<PreviousAudit | undefined> {
  const wanted = target.toLowerCase();
  const candidates = (await api.listIssues())
    .filter((i) => i.number < currentIssue && isFormIssue(i.body) && formRepo(i.body)?.toLowerCase() === wanted)
    .sort((a, b) => b.number - a.number)
    .slice(0, 3);
  for (const issue of candidates) {
    const comments = await api.listComments(issue.number);
    for (const c of comments) {
      if (c.author !== REPORT_AUTHOR || c.authorType !== "Bot") continue;
      const parsed = parseReportComment(c.body);
      if (!parsed || parsed.fullName.toLowerCase() !== wanted) continue;
      return {
        reference: repository ? `Issue ${issue.number} in ${repository}` : `Issue ${issue.number}`,
        date: c.createdAt.slice(0, 10),
        rulesetVersion: parsed.rulesetVersion,
        score: parsed.score,
        commitSha: parsed.commitSha,
        goal: parsed.goal,
        projectType: parsed.projectType,
      };
    }
  }
  return undefined;
}

/** owner/repo aus dem Formularfeld, mit derselben Prüfung wie der Audit selbst. */
function formRepo(body: string): string | null {
  const raw = parseIssueForm(body).repo;
  const direct = parseRepoInput(raw);
  if (direct.ok) return `${direct.owner}/${direct.repo}`;
  const suggestion = suggestRepoInput(raw);
  const retry = suggestion ? parseRepoInput(suggestion) : null;
  return retry?.ok ? `${retry.owner}/${retry.repo}` : null;
}

export function isFormIssue(body: string): boolean {
  return body.includes(`### ${FORM_LABELS.repo}`) && body.includes(`### ${FORM_LABELS.goal}`);
}

/**
 * Verhindert Benachrichtigungen und Querverweise aus dem Bericht: @Erwähnungen, #Nummern und
 * Links auf fremde Issues werden außerhalb von Codeblöcken mit einem unsichtbaren Wortverbinder getrennt.
 */
export function neutralizeGitHubRefs(md: string): string {
  const WJ = "\u2060";
  // Querverweise auf Issues und Pull Requests fremder Repositories, auch innerhalb von Adressen
  const issueUrl = (t: string) => t.replace(/github\.com\/(?=[^\s/]+\/[^\s/]+\/(?:issues|pull|discussions)\/\d)/gi, `github.com${WJ}/`);
  const text = (t: string) =>
    issueUrl(
      t
        .replace(/(^|[^A-Za-z0-9])@(?=[A-Za-z0-9])/g, `$1@${WJ}`)
        .replace(/#(?=\d)/g, `#${WJ}`)
        .replace(/\bGH-(?=\d)/gi, (m) => `${m.slice(0, 2)}${WJ}-`),
    );
  let fence: string | null = null;
  return md
    .split("\n")
    .map((line) => {
      if (fence) {
        if (closesFence(line, fence)) fence = null;
        return line;
      }
      const open = opensFence(line);
      if (open) {
        fence = open;
        return line;
      }
      // Adressen bleiben gültig (z. B. npmjs.com/package/@scope/x oder Anker #1-install); nur Issue-Links werden getrennt.
      return line
        .split(/(https?:\/\/[^\s<>()\]]+)/)
        .map((part, i) => (i % 2 === 1 ? issueUrl(part) : text(part)))
        .join("");
    })
    .join("\n");
}

/** Kürzt an einer Zeilengrenze und schließt einen offenen Codeblock. */
export function truncateComment(md: string, note: string, max = MAX_COMMENT_CHARS): string {
  if (md.length <= max) return md;
  const lines = md.slice(0, max - note.length - 20).split("\n");
  lines.pop();
  let fence: string | null = null;
  for (const line of lines) {
    if (fence) {
      if (closesFence(line, fence)) fence = null;
    } else fence = opensFence(line);
  }
  if (fence) lines.push(fence);
  return `${lines.join("\n")}\n\n> ${note}\n`;
}

export interface IssueAuditInput {
  issueNumber: number;
  issueBody: string;
  author: string;
  authorAssociation: string;
  githubToken?: string;
  outputDir?: string;
  runUrl?: string;
  /** owner/repo des RepoLaunch-Repositories, für den Link "neue Analyse starten". */
  repository?: string;
}

export interface IssueAuditResult {
  exitCode: number;
  comment: string;
  /** null: Issue bleibt offen (vorübergehender Fehler des Dienstes). */
  closedAs: "completed" | "not_planned" | null;
  artifactName?: string;
  outputDir?: string;
}

function footer(de: boolean, runUrl: string | undefined, repository: string | undefined): string {
  const run = runUrl ? (de ? ` ([Workflow-Lauf](${runUrl}))` : ` ([workflow run](${runUrl}))`) : "";
  const again = newIssueUrl(repository);
  const next = again ? (de ? ` [Neue Analyse starten](${again}), zum Beispiel nach deinen Änderungen.` : ` [Start a new analysis](${again}), for example after your changes.`) : "";
  return de
    ? `---\n_Automatisch erstellt von RepoLaunch${run}. Regelbasierter Audit ohne KI: öffentliche Daten über die GitHub-API gelesen, bei Webprodukten zusätzlich ein lesender Abruf der im Repository angegebenen Website; kein Code ausgeführt._${next}`
    : `---\n_Created automatically by RepoLaunch${run}. Rule-based audit without AI: public data read via the GitHub API, for web products also one read-only request to the website given in the repository; no code executed._${next}`;
}

export async function runIssueAudit(input: IssueAuditInput, api: IssueApi, deps: CliDeps & { now?: () => Date } = {}): Promise<IssueAuditResult> {
  const log = deps.log ?? ((line: string) => console.log(line));
  const form = parseIssueForm(input.issueBody);
  const langCode = optionCode(form.language);
  const lang: Language = langCode === "en" ? "en" : "de";
  const de = lang === "de";

  async function finish(text: string, closedAs: "completed" | "not_planned" | null, extra: Partial<IssueAuditResult> = {}, marker = "", exitCode = 0): Promise<IssueAuditResult> {
    // Erst entschärfen, dann kürzen: Die Kürzung berücksichtigt so auch die eingefügten Zeichen.
    const note = de ? "Bericht gekürzt. Der vollständige Bericht liegt als audit.md im Artefakt des Workflow-Laufs." : "Report truncated. The full report is available as audit.md in the workflow run artifact.";
    const body = `${truncateComment(neutralizeGitHubRefs(text), note)}\n\n${neutralizeGitHubRefs(footer(de, input.runUrl, input.repository))}\n${marker ? `\n${marker}\n` : ""}`;
    await api.comment(input.issueNumber, body);
    if (closedAs) {
      try {
        await api.close(input.issueNumber, closedAs);
      } catch (err) {
        // Der Bericht steht schon: kein zweiter Fehlerkommentar, aber ein roter Lauf für die verantwortliche Person.
        log(`Issue #${input.issueNumber}: Schließen fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
        return { exitCode: 1, comment: body, closedAs, ...extra };
      }
    }
    log(`Issue #${input.issueNumber}: Kommentar geschrieben${closedAs ? `, geschlossen (${closedAs})` : ", offen gelassen"}`);
    return { exitCode, comment: body, closedAs, ...extra };
  }

  // 1. Grenzen pro Person und insgesamt (frühere Formular-Issues der letzten Stunde)
  if (!TRUSTED_ASSOCIATIONS.has(input.authorAssociation)) {
    const now = deps.now?.() ?? new Date();
    const since = new Date(now.getTime() - 3_600_000);
    const recent = (await api.listRecentIssues(since.toISOString())).filter(
      (i) => i.number < input.issueNumber && new Date(i.createdAt) >= since && isFormIssue(i.body),
    );
    const byAuthor = recent.filter((i) => i.author.toLowerCase() === input.author.toLowerCase()).length;
    if (byAuthor >= ISSUE_LIMITS.perAuthorPerHour || recent.length >= ISSUE_LIMITS.globalPerHour) {
      const which = byAuthor >= ISSUE_LIMITS.perAuthorPerHour;
      return finish(
        de
          ? `# RepoLaunch: Limit erreicht\n\n${which ? `Pro Person sind höchstens ${ISSUE_LIMITS.perAuthorPerHour} Analysen pro Stunde möglich.` : `Insgesamt sind höchstens ${ISSUE_LIMITS.globalPerHour} Analysen pro Stunde möglich.`} Bitte in einer Stunde ein neues Issue öffnen.`
          : `# RepoLaunch: limit reached\n\n${which ? `At most ${ISSUE_LIMITS.perAuthorPerHour} analyses per person per hour.` : `At most ${ISSUE_LIMITS.globalPerHour} analyses per hour in total.`} Please open a new issue in an hour.`,
        "not_planned",
      );
    }
  }

  // 2. Audit mit denselben Prüfungen wie im Workflow-Formular; das KI-Paket ist hier nie aktiv.
  const env: Record<string, string | undefined> = {
    INPUT_REPO: form.repo,
    INPUT_GOAL: optionCode(form.goal),
    INPUT_LANGUAGE: langCode,
    INPUT_PROJECT_TYPE: optionCode(form.projectType),
    INPUT_AUDIENCE: form.audience,
    INPUT_KNOWN_FEATURES: form.knownFeatures,
    INPUT_AI_PACKAGE: "false",
    GITHUB_TOKEN: input.githubToken,
    OUTPUT_DIR: input.outputDir,
  };
  // Frühere Berichte zum selben Repository im Issue-Verlauf: nur als Hinweis zur Vergleichbarkeit, Fehler hier stoppen nichts.
  let previous: PreviousAudit | undefined;
  const target = formRepo(input.issueBody);
  // Nur bei sonst gültigen Angaben suchen; ungültige Anfragen kosten so keine zusätzlichen API-Aufrufe.
  const goalOk = GOALS.includes((optionCode(form.goal) ?? "users") as Goal);
  const typeCode = optionCode(form.projectType) ?? "auto";
  const typeOk = typeCode === "auto" || PROJECT_TYPES.includes(typeCode as ProjectType);
  const langOk = langCode === undefined || langCode === "de" || langCode === "en";
  if (target && goalOk && typeOk && langOk) {
    try {
      previous = await findPreviousAudit(api, target, input.issueNumber, input.repository);
    } catch (err) {
      log(`Frühere Berichte nicht lesbar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const result = await runAuditCli(env, { ...deps, provider: null, artifactsUrl: input.runUrl, previous });
  // Vorübergehende Fehler des Dienstes (Ratenlimit, Zeitlimit, GitHub-Störung) sind keine Eingabefehler:
  // Issue bleibt offen, der Lauf wird rot, ein erneuter Lauf über "Re-run" ist möglich.
  if (result.exitCode === 1 && result.errorCode && !INPUT_LIKE_ERRORS.has(result.errorCode)) {
    const later = de
      ? "Das liegt nicht an deiner Eingabe. Bitte versuche es später mit einem neuen Issue erneut; die verantwortliche Person sieht den fehlgeschlagenen Lauf."
      : "This is not caused by your input. Please try again later with a new issue; the maintainer can see the failed run.";
    return finish(`${result.summary}\n${later}`, null, {}, "", 1);
  }
  if (result.exitCode !== 0) {
    const retry = newIssueUrl(input.repository);
    const tips = de
      ? [
          "**So klappt es beim nächsten Mal:**",
          "",
          "1. Öffne auf GitHub die Startseite des Repositories, das du prüfen willst.",
          "2. Kopiere die Adresse aus der Adresszeile des Browsers, z. B. `https://github.com/octocat/hello-world`.",
          "3. Prüfe, ob das Repository öffentlich ist: Private Repositories kann RepoLaunch nicht lesen.",
          `4. ${retry ? `[Neue Analyse starten](${retry})` : "Öffne ein neues Issue mit dem Formular „Repository analysieren“"} und füge die Adresse ein.`,
        ]
      : [
          "**How to make it work next time:**",
          "",
          "1. Open the main page of the repository you want to check on GitHub.",
          "2. Copy the address from the browser's address bar, e.g. `https://github.com/octocat/hello-world`.",
          "3. Check that the repository is public: RepoLaunch cannot read private repositories.",
          `4. ${retry ? `[Start a new analysis](${retry})` : "Open a new issue with the form “Analyse a repository”"} and paste the address.`,
        ];
    return finish(`${result.summary}\n${tips.join("\n")}`, "not_planned");
  }
  return finish(result.summary, "completed", { artifactName: result.artifactName, outputDir: result.outputDir }, result.audit ? reportMarker(result.audit) : "");
}
