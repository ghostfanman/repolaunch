// Startet den serverlosen Audit (siehe src/cli/audit.ts). In GitHub Actions landet der Bericht
// in der Zusammenfassung der Ergebnisseite, lokal auf der Konsole.
//   INPUT_REPO=owner/repo npm run repo-audit

import { appendFileSync } from "node:fs";
import { runAuditCli } from "@/cli/audit";

const result = await runAuditCli(process.env);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.summary);
else console.log(result.summary);
if (process.env.GITHUB_OUTPUT && result.artifactName) {
  appendFileSync(process.env.GITHUB_OUTPUT, `artifact_name=${result.artifactName}\noutput_dir=${result.outputDir}\n`);
}
process.exit(result.exitCode);
