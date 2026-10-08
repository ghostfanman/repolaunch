// Führt alle Regeln aus, berechnet den internen Bereitschaftsscore und priorisiert fünf Aufgaben.

import { classifyProject } from "../analysis/classify";
import { readManifests } from "../analysis/manifests";
import { parseMarkdown } from "../analysis/markdown";
import { formatEffort } from "../format";
import { buildLaunchPlan } from "../launch-plan";
import { assessMonetization } from "../monetization";
import { detectInjection } from "../security/injection";
import { t } from "@/i18n/messages";
import { GOALS, PROJECT_TYPES, type AuditResult, type Category, type Finding, type Goal, type PrioritizedTask, type ProjectType, type ReadinessScore, type RepoSnapshot, type Severity, type UserContext } from "../types";
import { DEFAULT_RULE_CONFIG, effectiveWeight, type RuleConfig } from "./config";
import { RULES, type RuleContext } from "./definitions";
import { buildGuide } from "./guides";

const CATEGORY_ORDER: Category[] = ["understanding", "usability", "trust", "distribution"];

export function severityForWeight(weight: number): Severity {
  if (weight >= 3) return "high";
  if (weight === 2) return "medium";
  if (weight === 1) return "low";
  return "none";
}

/** Satz für "Nicht bewertete Regeln": mit welchem Ziel oder Projekttyp die Regel aktiv würde. */
function activationHint(lang: "de" | "en", goals: Goal[], projectTypes: ProjectType[]): string {
  const m = t(lang);
  if (goals.length > 0) {
    const list = goals.map((g) => `"${m.goals[g]}"`).join(", ");
    return lang === "de" ? ` Aktiv mit Ziel ${list}.` : ` Active with goal ${list}.`;
  }
  if (projectTypes.length > 0) {
    const list = projectTypes.map((pt) => `"${m.projectTypes[pt]}"`).join(", ");
    return lang === "de" ? ` Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp ${list}.` : ` Not active with any goal for this project type; active for project type ${list}.`;
  }
  return "";
}

export interface AuditOptions {
  config?: RuleConfig;
  now?: Date;
}

export function runAudit(snapshot: RepoSnapshot, user: UserContext, opts: AuditOptions = {}): AuditResult {
  const config = opts.config ?? DEFAULT_RULE_CONFIG;
  const now = opts.now ?? new Date();
  const lang = user.language;
  const classification = classifyProject(snapshot, user.projectTypeOverride);
  const readme = snapshot.readme.state === "present" ? parseMarkdown(snapshot.readme.text) : null;
  const ctx: RuleContext = {
    snapshot,
    user,
    projectType: classification.used,
    readme,
    readmePath: snapshot.readme.state === "present" ? snapshot.readme.path : null,
    manifests: readManifests(snapshot),
    now,
    lang,
  };
  const readmeMissing = snapshot.readme.state === "missing";

  const findings: Finding[] = [];
  for (const rule of RULES) {
    const cfg = config.rules[rule.id];
    const base = {
      id: `${rule.id}@${rule.version}`,
      ruleId: rule.id,
      ruleVersion: rule.version,
      category: rule.category,
      title: rule.title[lang],
      rationale: rule.rationale[lang],
    };
    if (!cfg || !cfg.enabled) {
      findings.push({
        ...base,
        status: "not_relevant",
        severity: "none",
        weight: 0,
        evidence: [],
        task: null,
        effort: null,
        effortMinutes: null,
        impactHypothesis: null,
        exclusionReason: lang === "de" ? "Per Konfiguration deaktiviert." : "Disabled by configuration.",
      });
      continue;
    }
    const weight = effectiveWeight(cfg, classification.used, user.goal);
    if (weight === 0) {
      // Hinweis, mit welchem Ziel (bei gleichem Projekttyp) oder welchem Projekttyp die Regel bewertet würde
      const goals = GOALS.filter((g) => g !== user.goal && effectiveWeight(cfg, classification.used, g) > 0);
      const projectTypes = goals.length > 0 ? [] : PROJECT_TYPES.filter((pt) => pt !== classification.used && GOALS.some((g) => effectiveWeight(cfg, pt, g) > 0));
      findings.push({
        ...base,
        status: "not_relevant",
        severity: "none",
        weight: 0,
        evidence: [],
        task: null,
        effort: null,
        effortMinutes: null,
        impactHypothesis: null,
        exclusionReason: `${
          lang === "de"
            ? `Für Projekttyp "${t(lang).projectTypes[classification.used]}" und Ziel "${t(lang).goals[user.goal]}" nicht relevant (Gewicht 0).`
            : `Not relevant for project type "${t(lang).projectTypes[classification.used]}" and goal "${t(lang).goals[user.goal]}" (weight 0).`
        }${activationHint(lang, goals, projectTypes)}`,
        ...(goals.length || projectTypes.length ? { activeWith: { goals, projectTypes } } : {}),
      });
      continue;
    }
    const outcome = rule.evaluate(ctx);
    const status = outcome.status;
    const bundled = status === "missing" && rule.readmeContent && readmeMissing;
    // Teilweise erfüllt: angerechnet wird das Gewicht ohne den offenen Teil; Schwere und Aufgabe beziehen sich nur auf den offenen Teil.
    const partial = status === "missing" ? outcome.partial : undefined;
    const credit = partial ? Math.max(0, weight - partial.openWeight) : 0;
    const effortMinutes = partial?.effortMinutes ?? rule.effortMinutes;
    findings.push({
      ...base,
      status,
      severity: status === "missing" ? severityForWeight(weight - credit) : "none",
      weight: status === "not_relevant" ? 0 : weight,
      rationale: outcome.note ? `${base.rationale} ${outcome.note[lang]}` : base.rationale,
      evidence: outcome.evidence,
      task: status === "missing" && !bundled ? (partial?.task ?? rule.task)[lang] : null,
      effort: status === "missing" ? formatEffort(effortMinutes, lang) : null,
      effortMinutes: status === "missing" ? effortMinutes : null,
      impactHypothesis: status === "missing" ? (partial?.impact ?? rule.impact)[lang] : null,
      ...(credit > 0 ? { partialCredit: credit } : {}),
      ...(partial ? { variant: partial.variant } : {}),
      exclusionReason:
        status === "unknown"
          ? outcome.note?.[lang] ?? (lang === "de" ? "Daten nicht verfügbar." : "Data not available.")
          : status === "not_relevant"
            ? outcome.note?.[lang]
            : bundled
              ? lang === "de" ? "In der Aufgabe \"README anlegen\" enthalten." : "Included in the task \"Create a README\"."
              : undefined,
    });
  }

  // Anleitungen für Einsteiger zu jeder offenen Aufgabe
  const guideCtx = { snapshot, lang, readmePath: ctx.readmePath, projectType: classification.used, manifests: ctx.manifests };
  for (const f of findings) {
    if (f.status === "missing" && f.task) f.guide = buildGuide(f.ruleId, guideCtx, f.variant);
  }

  // Fehlt die README, werden die README-Inhaltsregeln in einer Aufgabe gebündelt.
  if (readmeMissing) {
    const readmeFinding = findings.find((f) => f.ruleId === "understanding.readme");
    const bundledTitles = findings.filter((f) => f.status === "missing" && f.task === null && f.exclusionReason && f.ruleId !== "understanding.readme").map((f) => f.title);
    if (readmeFinding && readmeFinding.task && bundledTitles.length > 0) {
      readmeFinding.task += lang === "de" ? ` Enthalten sein sollten: ${bundledTitles.join("; ")}.` : ` It should include: ${bundledTitles.join("; ")}.`;
    }
  }

  const tasks = prioritize(findings);
  const score = computeScore(findings, lang);
  return {
    schemaVersion: 1,
    rulesetVersion: config.version,
    generatedAt: now.toISOString(),
    classification,
    findings,
    tasks,
    score,
    monetization: assessMonetization(snapshot, user, classification.used, findings),
    launchPlan: buildLaunchPlan(findings, tasks, user, snapshot),
    injectionFlags: detectInjection(snapshot),
  };
}

/** Offenes Gewicht eines fehlenden Befunds: volles Gewicht abzüglich einer Teilgutschrift. */
export function openWeight(f: Finding): number {
  return f.weight - (f.partialCredit ?? 0);
}

export function prioritize(findings: Finding[]): PrioritizedTask[] {
  const ruleOrder = new Map(RULES.map((r, i) => [r.id, i]));
  return findings
    .filter((f) => f.status === "missing" && f.task && f.effortMinutes)
    .sort(
      (a, b) =>
        openWeight(b) - openWeight(a) ||
        a.effortMinutes![0] - b.effortMinutes![0] ||
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
        (ruleOrder.get(a.ruleId) ?? 0) - (ruleOrder.get(b.ruleId) ?? 0),
    )
    .slice(0, 5)
    .map((f, i) => ({
      rank: i + 1,
      findingId: f.id,
      title: f.title,
      task: f.task!,
      severity: f.severity,
      effort: f.effort!,
      impactHypothesis: f.impactHypothesis!,
      why: f.rationale,
      ...(f.guide ? { guide: f.guide } : {}),
    }));
}

export function computeScore(findings: Finding[], lang: "de" | "en"): ReadinessScore {
  let achieved = 0;
  let possible = 0;
  let unknownWeight = 0;
  const byCategory = CATEGORY_ORDER.map((category) => ({ category, achieved: 0, possible: 0, unknownWeight: 0 }));
  const excluded: ReadinessScore["excluded"] = [];
  for (const f of findings) {
    const cat = byCategory.find((c) => c.category === f.category)!;
    if (f.status === "present" || f.status === "missing") {
      possible += f.weight;
      cat.possible += f.weight;
      const got = f.status === "present" ? f.weight : (f.partialCredit ?? 0);
      achieved += got;
      cat.achieved += got;
    } else {
      if (f.status === "unknown") {
        unknownWeight += f.weight;
        cat.unknownWeight += f.weight;
      }
      excluded.push({ ruleId: f.ruleId, status: f.status, reason: f.exclusionReason ?? "" });
    }
  }
  const relevant = possible + unknownWeight;
  return {
    value: possible > 0 ? Math.round((achieved / possible) * 100) : null,
    achievedWeight: achieved,
    possibleWeight: possible,
    unknownWeight,
    coverage: relevant > 0 ? possible / relevant : 0,
    byCategory,
    excluded,
    formula:
      lang === "de"
        ? `Score = Summe der Gewichte erfüllter Regeln (einschließlich Teilgutschriften) / Summe der Gewichte bewerteter Regeln × 100 = ${achieved} / ${possible} × 100. Unbekannte und nicht relevante Regeln zählen nicht. Abdeckung = bewertete Gewichte / (bewertete + unbekannte Gewichte) = ${possible} / ${relevant}.`
        : `Score = sum of weights of met rules (including partial credit) / sum of weights of scored rules × 100 = ${achieved} / ${possible} × 100. Unknown and not relevant rules do not count. Coverage = scored weights / (scored + unknown weights) = ${possible} / ${relevant}.`,
  };
}
