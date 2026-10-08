// Startet den Audit per Issue (siehe src/cli/issue.ts). Wird nur vom Workflow
// .github/workflows/repolaunch-issue.yml aufgerufen; alle Angaben kommen über Umgebungsvariablen.

import { appendFileSync } from "node:fs";
import { githubIssueApi, runIssueAudit } from "@/cli/issue";

const env = process.env;
const issueNumber = Number(env.ISSUE_NUMBER);
if (!Number.isInteger(issueNumber) || issueNumber <= 0 || !env.GITHUB_REPOSITORY || !env.GITHUB_TOKEN) {
  console.error("ISSUE_NUMBER, GITHUB_REPOSITORY und GITHUB_TOKEN sind erforderlich.");
  process.exit(2);
}
const api = githubIssueApi(env.GITHUB_REPOSITORY, env.GITHUB_TOKEN);

try {
  const result = await runIssueAudit(
    {
      issueNumber,
      issueBody: env.ISSUE_BODY ?? "",
      author: env.ISSUE_AUTHOR ?? "",
      authorAssociation: env.ISSUE_AUTHOR_ASSOCIATION ?? "NONE",
      githubToken: env.GITHUB_TOKEN,
      outputDir: env.OUTPUT_DIR,
      runUrl: env.RUN_URL,
      repository: env.GITHUB_REPOSITORY,
    },
    api,
  );
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, result.comment);
  if (env.GITHUB_OUTPUT && result.artifactName) appendFileSync(env.GITHUB_OUTPUT, `artifact_name=${result.artifactName}\n`);
  process.exit(result.exitCode);
} catch (err) {
  // Nur die Fehlermeldung, keine Umgebung oder Inhalte ins Log
  console.error(`Interner Fehler: ${err instanceof Error ? err.message : String(err)}`);
  try {
    await api.comment(issueNumber, "RepoLaunch: Interner Fehler bei der Analyse. Die verantwortliche Person wird über den fehlgeschlagenen Workflow-Lauf informiert. / Internal error during the analysis.\n\n---\n_RepoLaunch_");
  } catch {
    // Kommentar nicht möglich; der rote Workflow-Lauf bleibt als Hinweis.
  }
  process.exit(1);
}
