// Audit ohne Server: dieselbe Kernlogik wie die Web-App, gesteuert über Umgebungsvariablen.
// Wird vom GitHub-Actions-Workflow "RepoLaunch: Repository analysieren" genutzt (Formular im Reiter Actions).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runAiPackage, type AiPackageResult } from "@/core/ai/generate";
import { DEFAULT_AI_LIMITS, LlmError, type AiSection, type LlmProvider } from "@/core/ai/types";
import { collectSnapshot } from "@/core/github/collector";
import { CollectError } from "@/core/github/errors";
import { fetchTransport, GitHubHttp, type Transport } from "@/core/github/http";
import { DEFAULT_COLLECT_LIMITS } from "@/core/limits";
import { parseRepoInput, suggestRepoInput } from "@/core/repo-input";
import { buildExport } from "@/core/report/export";
import { createSiteFetcher } from "@/core/site/fetch";
import type { SiteFetcher } from "@/core/site/types";
import { applyRuleOverrides, DEFAULT_RULE_CONFIG } from "@/core/rules/config";
import { runAudit } from "@/core/rules/engine";
import { GOALS, PROJECT_TYPES, type Goal, type Language, type ProjectType, type UserContext } from "@/core/types";
import { t } from "@/i18n/messages";

/** Standardabschnitte des KI-Pakets, wie in der Web-Oberfläche vorausgewählt. */
export const CLI_AI_SECTIONS: AiSection[] = ["readme", "descriptionTopics", "plan30", "launchTexts", "monetization"];

export interface CliDeps {
  transport?: Transport;
  /**
   * Website-Abruf bei Webprodukten. null schaltet ihn ab. Ohne Angabe wird er nur für echte GitHub-Abrufe
   * erzeugt (kein eigener Transport); mit eingespeistem Transport (Tests) bleibt er aus, damit kein Netzwerkzugriff entsteht.
   */
  siteFetcher?: SiteFetcher | null;
  /** null erzwingt "kein Anbieter"; undefined erzeugt ihn aus der Umgebung. */
  provider?: LlmProvider | null;
  secrets?: string[];
  now?: () => Date;
  log?: (line: string) => void;
  /** Link auf den Workflow-Lauf mit den Artefakten, wenn der Bericht nicht auf der Lauf-Seite selbst erscheint (z. B. als Issue-Kommentar). */
  artifactsUrl?: string;
}

export interface CliResult {
  exitCode: number;
  summary: string;
  files: string[];
  outputDir?: string;
  artifactName?: string;
}

function fail(lang: Language, message: string, exitCode = 2): CliResult {
  const title = lang === "de" ? "RepoLaunch: Analyse nicht möglich" : "RepoLaunch: analysis not possible";
  return { exitCode, summary: `# ${title}\n\n${message}\n`, files: [] };
}

async function providerFromEnv(): Promise<{ provider: LlmProvider | null; secrets: string[] }> {
  // Erst hier laden, damit der Audit ohne KI keine KI-Konfiguration braucht.
  const { loadConfig, createProvider, configSecrets } = await import("@/server/config");
  const cfg = loadConfig();
  return { provider: createProvider(cfg), secrets: configSecrets(cfg) };
}

export async function runAuditCli(env: Record<string, string | undefined>, deps: CliDeps = {}): Promise<CliResult> {
  const log = deps.log ?? ((line: string) => console.log(line));
  const langRaw = (env.INPUT_LANGUAGE || "de").trim();
  const lang: Language = langRaw === "en" ? "en" : "de";
  const m = t(lang);
  const de = lang === "de";
  if (langRaw !== "de" && langRaw !== "en") return fail(lang, de ? "Sprache muss de oder en sein." : "Language must be de or en.");

  let repoInput = parseRepoInput(env.INPUT_REPO);
  let readAs: string | null = null;
  if (!repoInput.ok) {
    // Häufige Kopierformen (z. B. mit /tree/main) als owner/repo lesen; geprüft wird danach wie immer.
    const suggestion = suggestRepoInput(env.INPUT_REPO);
    const retry = suggestion ? parseRepoInput(suggestion) : null;
    if (!retry?.ok) {
      const example = de ? "Beispiel: octocat/hello-world oder https://github.com/octocat/hello-world" : "Example: octocat/hello-world or https://github.com/octocat/hello-world";
      return fail(lang, `${m.form.repoLabel}: ${m.inputErrors[repoInput.error] ?? repoInput.error} ${example}`);
    }
    repoInput = retry;
    readAs = suggestion;
  }

  const goal = (env.INPUT_GOAL || "users").trim() as Goal;
  if (!GOALS.includes(goal)) return fail(lang, de ? `Unbekanntes Ziel: ${goal}` : `Unknown goal: ${goal}`);

  const typeRaw = (env.INPUT_PROJECT_TYPE || "auto").trim();
  if (typeRaw !== "auto" && !PROJECT_TYPES.includes(typeRaw as ProjectType)) {
    return fail(lang, de ? `Unbekannter Projekttyp: ${typeRaw}` : `Unknown project type: ${typeRaw}`);
  }
  const audience = env.INPUT_AUDIENCE?.trim() || undefined;
  const knownFeatures = env.INPUT_KNOWN_FEATURES?.trim() || undefined;
  if ((audience?.length ?? 0) > 500 || (knownFeatures?.length ?? 0) > 2000) {
    return fail(lang, de ? "Zielgruppe höchstens 500, Merkmale höchstens 2000 Zeichen." : "Audience at most 500, characteristics at most 2000 characters.");
  }

  const user: UserContext = {
    goal,
    language: lang,
    audience,
    knownFeatures,
    projectTypeOverride: typeRaw === "auto" ? undefined : (typeRaw as ProjectType),
  };

  // 1. Erfassung über die feste GitHub-API, nur lesend; bei Webprodukten zusätzlich ein lesender Abruf der Website
  const http = new GitHubHttp({
    limits: DEFAULT_COLLECT_LIMITS,
    transport: deps.transport ?? fetchTransport,
    token: env.GITHUB_TOKEN || undefined,
    logger: { request: (e) => log(`GET ${e.path} -> ${e.status} (${e.ms} ms)`) },
  });
  let snapshot;
  try {
    const siteFetcher = deps.siteFetcher !== undefined ? deps.siteFetcher : !deps.transport && env.REPOLAUNCH_SITE_CHECK !== "0" ? createSiteFetcher() : null;
    snapshot = await collectSnapshot(
      http,
      { owner: repoInput.owner, repo: repoInput.repo, goal, source: "github", projectTypeOverride: user.projectTypeOverride },
      DEFAULT_COLLECT_LIMITS,
      deps.now,
      { siteFetcher },
    );
  } catch (err) {
    if (err instanceof CollectError) {
      const extra = err.resetAt ? ` (Reset ${err.resetAt})` : err.retryAfterSeconds ? ` (Retry-After ${err.retryAfterSeconds}s)` : "";
      return fail(lang, `${repoInput.owner}/${repoInput.repo}: ${m.jobErrors[err.code] ?? err.code}${extra}`, 1);
    }
    throw err;
  }

  // 2. Regelbasierter Audit
  const rules = env.REPOLAUNCH_RULES_CONFIG ? applyRuleOverrides(DEFAULT_RULE_CONFIG, JSON.parse(readFileSync(env.REPOLAUNCH_RULES_CONFIG, "utf8"))) : DEFAULT_RULE_CONFIG;
  const audit = runAudit(snapshot, user, { config: rules, now: deps.now?.() });

  // 3. Optionales KI-Paket, nur nach ausdrücklicher Wahl im Formular
  let ai: AiPackageResult | null = null;
  const aiNotes: string[] = [];
  if (env.INPUT_AI_PACKAGE === "true") {
    let provider = deps.provider;
    let secrets = deps.secrets ?? [];
    if (provider === undefined) {
      if (env.ANTHROPIC_API_KEY || env.AI_PROVIDER) {
        const p = await providerFromEnv();
        provider = p.provider;
        secrets = p.secrets;
      } else {
        provider = null;
      }
    }
    if (!provider) {
      aiNotes.push(de ? "KI-Paket gewählt, aber kein Secret `ANTHROPIC_API_KEY` hinterlegt. Der Audit wurde ohne KI erstellt." : "AI package selected, but no `ANTHROPIC_API_KEY` secret is set. The audit was created without AI.");
    } else {
      try {
        ai = await runAiPackage({ provider, snapshot, audit, user, sections: CLI_AI_SECTIONS, limits: DEFAULT_AI_LIMITS, secrets, now: deps.now });
      } catch (err) {
        const code = err instanceof LlmError ? err.code : "internal_error";
        aiNotes.push(`${m.ai.failed}: ${m.aiErrors[code] ?? code}. ${de ? "Der Audit ist davon nicht betroffen." : "The audit is not affected."}`);
      }
    }
  }

  // 4. Export als Dateien (das Actions-Artefakt wird von GitHub selbst als ZIP angeboten)
  const bundle = buildExport(snapshot, audit, user, ai);
  const outputDir = path.resolve(env.OUTPUT_DIR || "repolaunch-output");
  mkdirSync(outputDir, { recursive: true });
  const files = Object.keys(bundle.contents);
  for (const name of files) writeFileSync(path.join(outputDir, name), bundle.contents[name]!);
  const artifactName = bundle.filename.replace(/\.zip$/, "");

  // 5. Zusammenfassung für die Ergebnisseite des Workflows
  const head: string[] = [];
  const where = deps.artifactsUrl
    ? de ? `im [Workflow-Lauf](${deps.artifactsUrl}) unter **Artifacts** (7 Tage)` : `in the [workflow run](${deps.artifactsUrl}) under **Artifacts** (7 days)`
    : de ? "unten auf dieser Seite unter **Artifacts**" : "at the bottom of this page under **Artifacts**";
  head.push(
    de
      ? `> Alle Dateien (${files.join(", ")}) stehen ${where} als \`${artifactName}\` zum Download bereit.`
      : `> All files (${files.join(", ")}) are available for download ${where} as \`${artifactName}\`.`,
    "",
  );
  if (readAs) head.push(de ? `> Die Eingabe wurde als \`${readAs}\` gelesen.` : `> The input was read as \`${readAs}\`.`, "");
  for (const n of aiNotes) head.push(`> ${n}`, "");
  if (ai) {
    const d = ai.disclosure;
    head.push(`## ${m.ai.dataSent}`, "", `- ${m.ai.provider}: ${d.provider}`, `- ${m.ai.model}: \`${d.model}\``, `- ${m.ai.endpoint}: \`${d.endpointHost}\``);
    for (const item of d.items) head.push(`- ${item.label[lang]}: ${item.chars} ${m.ai.chars}${item.note ? ` (${item.note[lang]})` : ""}`);
    head.push(`- ${m.ai.redacted}: ${d.redactedLines}`, "");
  }
  const summary = `${head.join("\n")}\n${bundle.contents["audit.md"]}`;
  log(`${snapshot.fullName} @ ${snapshot.commitSha}: Score ${audit.score.value}, ${audit.tasks.length} Aufgaben, Dateien: ${files.join(", ")}`);
  return { exitCode: 0, summary, files, outputDir, artifactName };
}
