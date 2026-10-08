// Markdown-Berichte für den Export. Repository-Inhalte stehen nur in Codeblöcken oder als bereinigter Text.

import type { AiPackageResult } from "../ai/generate";
import { t } from "@/i18n/messages";
import { fencedBlock, inlineText, safeUrl, stripControl } from "../security/sanitize";
import type { AuditResult, Category, Evidence, Finding, Language, PreviousAudit, RepoSnapshot, TaskGuide, UserContext } from "../types";
import { glossaryFor, previousAuditSentence, requestLines, scoreVerdict, siteScopeText, strengths } from "./plain";

const CATEGORY_ORDER: Category[] = ["understanding", "usability", "trust", "distribution"];

function link(label: string, url: string | undefined | null): string {
  const u = safeUrl(url);
  return u ? `[${inlineText(label)}](${u.replace(/\(/g, "%28").replace(/\)/g, "%29")})` : inlineText(label);
}

function evidenceMd(e: Evidence, lang: Language): string {
  const to = lang === "de" ? "bis" : "to";
  const lines = e.lines ? ` (${t(lang).report.lines} ${e.lines[0]} ${to} ${e.lines[1]})` : "";
  let out = `- ${link(e.label, e.url)}${lines}`;
  if (e.snippet) out += `\n\n${indent(fencedBlock(e.snippet))}\n`;
  return out;
}

function indent(s: string): string {
  return s.split("\n").map((l) => `  ${l}`).join("\n");
}

function header(snapshot: RepoSnapshot, lang: Language, title: string): string {
  const m = t(lang);
  const lines = [`# ${inlineText(title)}: ${inlineText(snapshot.fullName)}`, ""];
  if (snapshot.source === "fixture") lines.push(`> ${m.report.demoBanner}`, "");
  lines.push(
    `- Repository: ${link(snapshot.fullName, snapshot.htmlUrl)}`,
    `- ${m.report.analyzedCommit}: \`${snapshot.commitSha}\` (${m.report.defaultBranch} \`${inlineText(snapshot.defaultBranch)}\`)`,
    `- ${m.report.analyzedAt}: ${snapshot.analyzedAt}`,
    "",
  );
  return lines.join("\n");
}

export interface ExportFileInfo {
  name: string;
  included: boolean;
  reason?: string;
}

/** Zusätzliche, belegte Angaben für den Bericht, die nicht zur Bewertung gehören. */
export interface ReportContext {
  previous?: PreviousAudit;
}

export function renderAuditMarkdown(snapshot: RepoSnapshot, audit: AuditResult, user: UserContext, files: ExportFileInfo[], ai: AiPackageResult | null, context: ReportContext = {}): string {
  const lang = user.language;
  const m = t(lang);
  const de = lang === "de";
  const out: string[] = [header(snapshot, lang, de ? "RepoLaunch-Audit" : "RepoLaunch audit")];
  const s = audit.score;
  const classification = `${m.projectTypes[audit.classification.used]}${audit.classification.overridden ? ` (${m.report.overriddenBy}; ${m.report.detectedAs} ${m.projectTypes[audit.classification.detected]})` : ""}`;

  // Kurzfassung für Einsteiger
  out.push(`## ${m.report.inShort}`, "");
  const version = `${m.report.rulesetVersion} \`${audit.rulesetVersion}\``;
  out.push(`${s.value === null ? "" : `**${s.value} ${m.report.points}** (${version}). `}${scoreVerdict(s.value, lang)}`, "");
  out.push(`- ${m.report.projectType}: ${classification}`, `- ${m.report.goal}: ${m.goals[user.goal]}`, "");
  const good = strengths(audit);
  out.push(`**${m.report.strengthsLabel}:** ${good.length ? good.map((f) => inlineText(f.title)).join(", ") : m.report.noStrengths}`, "");
  out.push(`> ${m.report.howToUse}`, "");

  // Aufgaben mit Anleitung
  const tasksStart = out.length;
  out.push(`## ${m.report.tasksHeading}`, "");
  if (audit.tasks.length < 5) out.push(m.report.tasksFewer, "");
  for (const task of audit.tasks) {
    out.push(`### ${task.rank}. ${inlineText(task.guide?.action ?? task.title)}`, "");
    out.push(`**${m.report.why}:** ${inlineText(task.why, 800)}`, "");
    out.push(`**${m.report.task}:** ${inlineText(task.task, 600)}`, "");
    out.push(`${m.report.effort}: ${task.effort} · ${m.report.importance}: ${m.severities[task.severity]}`, "");
    if (task.guide) out.push(...guideMd(task.guide, lang));
    out.push(`${m.report.impact}: ${inlineText(task.impactHypothesis, 400)}`, "");
    out.push(`${m.report.ruleRef}: ${inlineText(task.title)} (\`${task.findingId}\`), ${de ? "siehe „Alle Befunde“" : "see “All findings”"}.`, "");
  }
  const terms = glossaryFor(out.slice(tasksStart).join("\n"), lang);
  if (terms.length) {
    out.push(`## ${m.report.glossary}`, "");
    for (const g of terms) out.push(`- **${g.term}**: ${g.text}`);
    out.push("");
  }

  // Score und Kennzahlen
  out.push(`## ${m.report.scoreHeading}`, "", `> ${m.report.scoreDisclaimer}`, "");
  out.push(s.value === null ? `${m.report.scoreNone} (${version})` : `**${s.value} / 100** (${version}), ${m.report.coverage} ${Math.round(s.coverage * 100)} %`, "");
  out.push(`> ${m.report.comparability}`, "");
  if (context.previous) {
    out.push(previousAuditSentence(context.previous, { rulesetVersion: audit.rulesetVersion, commitSha: snapshot.commitSha, goal: user.goal, projectType: audit.classification.used }, lang), "");
  }
  out.push(`${m.report.calculation}: ${s.formula}`, "");
  out.push(`| ${de ? "Kategorie" : "Category"} | ${de ? "Erfüllt" : "Met"} | ${de ? "Bewertet" : "Scored"} | ${de ? "Unbekannt" : "Unknown"} |`, "| --- | --- | --- | --- |");
  for (const c of s.byCategory) out.push(`| ${m.categories[c.category]} | ${c.achieved} | ${c.possible} | ${c.unknownWeight} |`);
  out.push(
    "",
    `- ${m.report.rulesetVersion}: \`${audit.rulesetVersion}\``,
    ...requestLines(snapshot, lang).map((r) => `- ${r.label}: ${r.value}`),
    `- ${m.report.stars}: ${snapshot.display.stars ?? "?"}`,
    "",
  );

  // Befunde
  out.push(`## ${m.report.findingsHeading}`, "");
  const rankOf = (f: Finding) => audit.tasks.find((x) => x.findingId === f.id)?.rank;
  for (const cat of CATEGORY_ORDER) {
    out.push(`### ${m.categories[cat]}`, "");
    for (const f of audit.findings.filter((x) => x.category === cat && x.status !== "not_relevant" && x.scope !== "website")) {
      out.push(findingMd(f, lang, rankOf(f)), "");
    }
  }
  // Website: eigene Gruppe mit Hinweis auf den Umfang der Prüfung
  const siteFindings = audit.findings.filter((x) => x.scope === "website" && x.status !== "not_relevant");
  if (siteFindings.length > 0) {
    out.push(`### ${m.report.websiteHeading}`, "");
    if (audit.siteScope) out.push(`> ${inlineText(siteScopeText(audit.siteScope, lang), 1200)}`, "");
    for (const f of siteFindings) out.push(findingMd(f, lang, rankOf(f)), "");
  }

  // Nicht bewertete Regeln
  out.push(`## ${m.report.excludedRules}`, "");
  for (const x of s.excluded) out.push(`- \`${x.ruleId}\`: ${m.statuses[x.status]}. ${inlineText(x.reason, 300)}`);
  out.push("");

  // Nutzerangaben
  if (user.audience || user.knownFeatures) {
    out.push(`## ${m.report.userInput}`, "");
    if (user.audience) out.push(`- ${m.form.audienceLabel}: ${inlineText(user.audience, 500)}`);
    if (user.knownFeatures) out.push(`- ${m.form.featuresLabel}: ${inlineText(user.knownFeatures, 1000)}`);
    out.push("");
  }

  // Hinweise
  if (snapshot.notes.length > 0) {
    out.push(`## ${m.report.notes}`, "");
    for (const n of snapshot.notes) out.push(`- ${inlineText(n[lang], 400)}`);
    out.push("");
  }
  if (audit.injectionFlags.length > 0) {
    out.push(`## ${m.report.injectionHeading}`, "", m.report.injectionText, "");
    for (const f of audit.injectionFlags) out.push(`- \`${inlineText(f.path, 120)}\` ${m.report.lines} ${f.line} (${f.pattern})`, "", indent(fencedBlock(f.excerpt)), "");
  }

  // KI
  if (ai) {
    out.push(`## ${m.ai.heading}`, "");
    out.push(`- ${m.ai.provider}: ${inlineText(ai.provider)}${ai.isTestAdapter ? ` (${m.ai.fakeProvider})` : ""}`);
    out.push(`- ${m.ai.model}: \`${inlineText(ai.model)}\``);
    out.push(`- ${m.ai.cost}: ${ai.cost.estimatedUsd === null ? "?" : `${ai.cost.estimatedUsd} USD`} (${ai.cost.inputTokens} in, ${ai.cost.outputTokens} out). ${ai.cost.note[lang]}`);
    const unverified = ai.checks.filter((c) => c.status === "unverified").length;
    out.push(`- ${m.ai.checks}: ${unverified} ${m.ai.unverified.toLowerCase()}`, "");
  }

  // Exportinhalt
  out.push(`## ${de ? "Inhalt dieses Exports" : "Contents of this export"}`, "", m.report.exportContents, "");
  for (const f of files) out.push(`- \`${f.name}\`: ${f.included ? (de ? "enthalten" : "included") : `${de ? "nicht enthalten" : "not included"}. ${f.reason ?? ""}`}`);
  out.push("");
  return out.join("\n");
}

/** Anleitung als Markdown: nummerierte Schritte, Vorlage im Codeblock, Hinweis. Texte sind fest, Links nur github.com. */
function guideMd(g: TaskGuide, lang: Language): string[] {
  const m = t(lang);
  const out = [`**${m.report.howTo}:**`, ""];
  g.steps.forEach((step, i) => out.push(`${i + 1}. ${inlineText(step.text, 600)}${step.link ? ` ${link(step.link.label, step.link.url)}` : ""}`));
  out.push("");
  if (g.template) {
    const ext = g.template.filename?.split(".").pop()?.toLowerCase();
    const syntax = ext === "md" ? "markdown" : ext === "yml" || ext === "yaml" ? "yaml" : "text";
    out.push(`${inlineText(g.template.label)}:`, "", fencedBlock(g.template.content.trimEnd(), syntax), "");
  }
  if (g.note) out.push(`> ${m.report.noteLabel}: ${inlineText(g.note, 600)}`, "");
  return out;
}

function findingMd(f: Finding, lang: Language, taskRank?: number): string {
  const m = t(lang);
  const lines = [`#### ${inlineText(f.title)} (\`${f.id}\`)`, ""];
  const partial = f.partialCredit ? ` (${m.report.partialCredit}: ${f.partialCredit} / ${f.weight})` : "";
  lines.push(`- ${m.report.status}: **${m.statuses[f.status]}**${f.status === "missing" ? `, ${m.report.severity}: ${m.severities[f.severity]}` : ""}, ${m.report.weight}: ${f.weight}${partial}`);
  lines.push(`- ${m.report.rationale}: ${inlineText(f.rationale, 800)}`);
  if (f.task) lines.push(`- ${m.report.task}: ${inlineText(f.task, 800)}`);
  if (f.effort) lines.push(`- ${m.report.effort}: ${f.effort}`);
  if (f.impactHypothesis) lines.push(`- ${m.report.impact}: ${inlineText(f.impactHypothesis, 400)}`);
  if (f.exclusionReason) lines.push(`- ${inlineText(f.exclusionReason, 300)}`);
  if (f.guide && taskRank) lines.push(`- ${m.report.howTo}: ${lang === "de" ? `siehe Aufgabe ${taskRank} oben` : `see task ${taskRank} above`}`);
  if (f.guide && !taskRank) lines.push("", ...guideMd(f.guide, lang).join("\n").split("\n").map((l) => (l ? `  ${l}` : l)));
  lines.push(`- ${m.report.evidence}:`, "");
  if (f.evidence.length === 0) lines.push(`  ${m.report.noEvidence}`);
  for (const e of f.evidence) lines.push(indent(evidenceMd(e, lang)));
  return lines.join("\n");
}

export function renderLaunchPlanMarkdown(snapshot: RepoSnapshot, audit: AuditResult, user: UserContext, ai: AiPackageResult | null): string {
  const lang = user.language;
  const m = t(lang);
  const de = lang === "de";
  const out = [header(snapshot, lang, de ? "30-Tage-Launch-Plan" : "30-day launch plan")];
  out.push(`## ${m.report.launchPlanHeading}`, "");
  out.push(de ? "Abgeleitet aus den Befunden. Erwartete Wirkungen sind Hypothesen, keine Zusagen." : "Derived from the findings. Expected effects are hypotheses, not commitments.", "");
  for (const week of [1, 2, 3, 4] as const) {
    const tasks = audit.launchPlan.tasks.filter((x) => x.week === week);
    if (tasks.length === 0) continue;
    out.push(`### ${m.report.week} ${week}`, "");
    for (const task of tasks) {
      out.push(`- [ ] **${inlineText(task.title)}** (${task.effort})${task.findingIds.length ? ` \`${task.findingIds.join("`, `")}\`` : ""}`);
      out.push(`  ${inlineText(task.why, 600)}`);
      out.push(`  ${m.report.signal}: ${inlineText(task.signal, 300)}`);
    }
    out.push("");
  }
  if (ai?.output.plan30) {
    out.push(`## ${de ? "KI-Entwurf: 30-Tage-Plan" : "AI draft: 30-day plan"}`, "", aiNotice(ai, lang), "");
    for (const task of ai.output.plan30.tasks) {
      out.push(`- [ ] ${m.report.week} ${task.week}: **${inlineText(task.title)}** (${inlineText(task.effort, 80)})${task.findingIds.length ? ` \`${task.findingIds.map((x) => inlineText(x, 60)).join("`, `")}\`` : ""}`);
      out.push(`  ${inlineText(task.why, 600)}`);
    }
    out.push("");
  }
  return out.join("\n");
}

export function renderMonetizationMarkdown(snapshot: RepoSnapshot, audit: AuditResult, user: UserContext, ai: AiPackageResult | null): string {
  const lang = user.language;
  const m = t(lang);
  const de = lang === "de";
  const mon = audit.monetization;
  const out = [header(snapshot, lang, de ? "Einnahmewege" : "Revenue options")];
  out.push(`## ${m.report.monetizationHeading}`, "", inlineText(mon.summary, 600), "", `> ${inlineText(mon.licenseNote, 800)}`, "");
  for (const o of mon.options) {
    out.push(`### ${inlineText(o.title)}: ${m.report.fit[o.fit]}`, "");
    for (const r of o.reasons) out.push(`- ${inlineText(r, 400)}`);
    out.push(
      `- ${m.report.whoPays}: ${inlineText(o.whoPays, 400)}`,
      `- ${m.report.forWhat}: ${inlineText(o.forWhat, 400)}`,
      `- ${m.report.prerequisites}: ${o.prerequisites.map((p) => inlineText(p, 300)).join("; ")}`,
      `- ${m.report.effort}: ${inlineText(o.effort, 200)}`,
      `- ${m.report.targetCustomers}: ${inlineText(o.targetCustomers, 300)}`,
      `- ${m.report.priceHypothesis}: ${inlineText(o.priceHypothesis, 300)}`,
      "",
    );
  }
  out.push(`## ${de ? "Hinweise" : "Notes"}`, "");
  for (const d of mon.disclaimers) out.push(`- ${inlineText(d, 400)}`);
  out.push(`- ${link("GitHub Sponsors", "https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors")}`, "");
  if (ai?.output.monetization) {
    out.push(`## ${de ? "KI-Entwurf: drei Optionen" : "AI draft: three options"}`, "", aiNotice(ai, lang), "");
    for (const o of ai.output.monetization.options) {
      out.push(
        `### ${inlineText(o.title)} (\`${o.type}\`)`,
        "",
        `- ${m.report.whoPays}: ${inlineText(o.whoPays, 500)}`,
        `- ${m.report.forWhat}: ${inlineText(o.forWhat, 500)}`,
        `- ${m.report.prerequisites}: ${o.prerequisites.map((p) => inlineText(p, 300)).join("; ")}`,
        `- ${m.report.effort}: ${inlineText(o.effort, 200)}`,
        `- ${m.report.targetCustomers}: ${inlineText(o.targetCustomers, 400)}`,
        `- ${m.report.priceHypothesis}: ${inlineText(o.priceHypothesis, 300)}`,
        "",
      );
    }
  }
  return out.join("\n");
}

function aiNotice(ai: AiPackageResult, lang: Language): string {
  const de = lang === "de";
  return `> ${de ? "KI-Entwurf" : "AI draft"} (${inlineText(ai.provider)}, \`${inlineText(ai.model)}\`${ai.isTestAdapter ? (de ? ", Testadapter" : ", test adapter") : ""}). ${de ? "Vor Verwendung prüfen. Nutzerangaben sind nicht belegt." : "Review before use. User-provided facts are not evidenced."}`;
}

function checksMd(ai: AiPackageResult, lang: Language, sections: string[]): string[] {
  const m = t(lang);
  const items = ai.checks.filter((c) => c.status === "unverified" && sections.includes(c.section));
  if (items.length === 0) return [];
  const out = [`## ${m.ai.checks}`, ""];
  for (const c of items) out.push(`- ${m.ai.unverified} (${c.kind}): \`${c.value.replace(/`/g, "'")}\`. ${inlineText(c.reason[lang], 300)}`);
  out.push("");
  return out;
}

function questionsMd(ai: AiPackageResult, lang: Language): string[] {
  const m = t(lang);
  const out: string[] = [];
  if (ai.output.openQuestions.length) {
    out.push(`## ${m.ai.openQuestions}`, "");
    for (const q of ai.output.openQuestions) out.push(`- ${inlineText(q, 500)}`);
    out.push("");
  }
  if (ai.output.userProvidedFactsUsed.length) {
    out.push(`## ${m.report.userInput}`, "");
    for (const q of ai.output.userProvidedFactsUsed) out.push(`- ${inlineText(q, 500)}`);
    out.push("");
  }
  return out;
}

export function renderReadmeSuggested(ai: AiPackageResult, lang: Language): string | null {
  if (!ai.output.readme || ai.readmeAnnotated === null) return null;
  const de = lang === "de";
  const out = [
    stripControl(ai.readmeAnnotated),
    "",
    "---",
    "",
    `${de ? "Entwurf von RepoLaunch" : "Draft by RepoLaunch"}. ${aiNotice(ai, lang).replace(/^> /, "")}`,
    "",
    ...checksMd(ai, lang, ["readme"]),
    ...questionsMd(ai, lang),
  ];
  return out.join("\n");
}

export function renderMarketingDrafts(snapshot: RepoSnapshot, ai: AiPackageResult, lang: Language): string | null {
  const o = ai.output;
  if (!o.launchTexts && !o.descriptionTopics && !o.landingPage) return null;
  const de = lang === "de";
  const out = [header(snapshot, lang, de ? "Marketing-Entwürfe" : "Marketing drafts"), aiNotice(ai, lang), ""];
  if (o.descriptionTopics) {
    out.push(`## ${de ? "Beschreibung und Topics" : "Description and topics"}`, "", fencedBlock(o.descriptionTopics.description), "", `Topics: ${o.descriptionTopics.topics.map((x) => `\`${x}\``).join(", ")}`, "", inlineText(o.descriptionTopics.rationale, 1000), "");
  }
  if (o.launchTexts) {
    out.push(`## LinkedIn`, "", fencedBlock(o.launchTexts.linkedin), "");
    out.push(`## ${de ? "Entwicklercommunity" : "Developer community"}: ${inlineText(o.launchTexts.community.name, 120)}`, "", fencedBlock(o.launchTexts.community.text), "");
    out.push(`## ${de ? "Release-Ankündigung" : "Release announcement"}`, "", fencedBlock(o.launchTexts.releaseAnnouncement), "");
  }
  if (o.landingPage) {
    out.push(`## ${de ? "Landingpage (Markdown-Entwurf, kein Deployment)" : "Landing page (Markdown draft, no deployment)"}`, "", fencedBlock(o.landingPage.markdown, "markdown"), "");
  }
  out.push(...checksMd(ai, lang, ["launchTexts", "descriptionTopics", "landingPage"]));
  out.push(...questionsMd(ai, lang));
  return out.join("\n");
}
