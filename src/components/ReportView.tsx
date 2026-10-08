"use client";

import { Fragment } from "react";
import type React from "react";

import { requestLines, scoreVerdict, siteScopeText, strengths } from "@/core/report/plain";
import type { Category, Evidence, Finding, Language, TaskGuide } from "@/core/types";
import { t } from "@/i18n/messages";
import type { JobView } from "@/server/service";
import { ScrollPre } from "./ScrollPre";

const CATEGORY_ORDER: Category[] = ["understanding", "usability", "trust", "distribution"];

/** Springt zu einem Befund, ohne das URL-Fragment mit dem Zugriffsschlüssel zu überschreiben. */
function jumpTo(e: React.MouseEvent, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  const details = el?.querySelector("details");
  if (details) details.open = true;
  const summary = el?.querySelector("summary");
  summary?.scrollIntoView({ block: "start" });
  summary?.focus();
}

/** Nur selbst erzeugte GitHub-Links werden als Link dargestellt. */
function safeHref(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "github.com" || u.hostname === "docs.github.com") ? u.toString() : null;
  } catch {
    return null;
  }
}

function EvidenceItem({ e, lang }: { e: Evidence; lang: Language }) {
  const m = t(lang);
  const href = safeHref(e.url);
  const range = e.lines ? ` (${m.report.lines} ${e.lines[0]} ${lang === "de" ? "bis" : "to"} ${e.lines[1]})` : "";
  return (
    <li>
      {href ? (
        <a href={href} rel="noopener noreferrer nofollow" target="_blank">
          {e.label}
          <span className="visually-hidden"> ({m.report.openOnGithub})</span>
        </a>
      ) : (
        <span>{e.label}</span>
      )}
      {range}
      {e.snippet && <ScrollPre>{e.snippet}</ScrollPre>}
    </li>
  );
}

/** Klick-für-Klick-Anleitung zu einer Aufgabe. */
function GuideView({ g, lang }: { g: TaskGuide; lang: Language }) {
  const m = t(lang);
  return (
    <div className="guide">
      <h4>{m.report.howTo}</h4>
      <ol>
        {g.steps.map((step, i) => {
          const href = safeHref(step.link?.url);
          return (
            <li key={i}>
              {step.text}
              {step.link && href && (
                <>
                  {" "}
                  <a href={href} rel="noopener noreferrer nofollow" target="_blank">
                    {step.link.label}
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {g.template && (
        <>
          <p className="muted">{g.template.label}:</p>
          <ScrollPre>{g.template.content.trimEnd()}</ScrollPre>
        </>
      )}
      {g.note && (
        <p className="muted">
          {m.report.noteLabel}: {g.note}
        </p>
      )}
    </div>
  );
}

function FindingItem({ f, lang }: { f: Finding; lang: Language }) {
  const m = t(lang);
  return (
    <details className="finding">
      <summary>
        <span className={`badge ${f.status}`}>{m.statuses[f.status]}</span>
        {f.status === "missing" && (
          <span className="badge sev">
            {m.report.severity}: {m.severities[f.severity]}
          </span>
        )}
        <span>{f.title}</span>
      </summary>
      <div>
        <dl className="meta">
          <dt>ID</dt>
          <dd>
            <code>{f.id}</code>
          </dd>
          <dt>{m.report.weight}</dt>
          <dd>
            {f.weight}
            {f.partialCredit ? ` (${m.report.partialCredit}: ${f.partialCredit} / ${f.weight})` : ""}
          </dd>
          <dt>{m.report.rationale}</dt>
          <dd>{f.rationale}</dd>
          {f.task && (
            <>
              <dt>{m.report.task}</dt>
              <dd>{f.task}</dd>
            </>
          )}
          {f.effort && (
            <>
              <dt>{m.report.effort}</dt>
              <dd>{f.effort}</dd>
            </>
          )}
          {f.impactHypothesis && (
            <>
              <dt>{m.report.impact}</dt>
              <dd>{f.impactHypothesis}</dd>
            </>
          )}
          {f.exclusionReason && (
            <>
              <dt>{m.report.status}</dt>
              <dd>{f.exclusionReason}</dd>
            </>
          )}
        </dl>
        {f.guide && <GuideView g={f.guide} lang={lang} />}
        <h4>{m.report.evidence}</h4>
        {f.evidence.length === 0 ? (
          <p>{m.report.noEvidence}</p>
        ) : (
          <ul className="evidence">
            {f.evidence.map((e, i) => (
              <EvidenceItem key={i} e={e} lang={lang} />
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export function ReportView({ lang, view }: { lang: Language; view: JobView }) {
  const m = t(lang);
  const audit = view.audit!;
  const snap = view.snapshot!;
  const user = view.input.user;
  const s = audit.score;
  const locale = lang === "de" ? "de-DE" : "en-GB";
  return (
    <>
      {snap.source === "fixture" && (
        <p className="notice warn" role="note">
          <strong>{m.report.demoBanner}</strong>
        </p>
      )}
      <section aria-labelledby="overview-h">
        <h2 id="overview-h">{lang === "de" ? "Überblick" : "Overview"}</h2>
        <dl className="meta">
          <dt>Repository</dt>
          <dd>
            {safeHref(snap.htmlUrl) ? (
              <a href={safeHref(snap.htmlUrl)!} rel="noopener noreferrer nofollow" target="_blank">
                {snap.fullName}
              </a>
            ) : (
              snap.fullName
            )}
          </dd>
          <dt>{m.report.analyzedCommit}</dt>
          <dd>
            <code>{snap.commitSha}</code> ({m.report.defaultBranch} <code>{snap.defaultBranch}</code>)
          </dd>
          <dt>{m.report.analyzedAt}</dt>
          <dd>
            <time dateTime={snap.analyzedAt}>{new Date(snap.analyzedAt).toLocaleString(locale)}</time>
          </dd>
          <dt>{m.report.projectType}</dt>
          <dd>
            {m.projectTypes[audit.classification.used]}
            {audit.classification.overridden && ` (${m.report.overriddenBy}; ${m.report.detectedAs} ${m.projectTypes[audit.classification.detected]})`}
          </dd>
          <dt>{m.report.goal}</dt>
          <dd>{m.goals[user.goal]}</dd>
          <dt>{m.report.rulesetVersion}</dt>
          <dd>
            <code>{audit.rulesetVersion}</code>
          </dd>
          {requestLines(snap, lang).map((r) => (
            <Fragment key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </Fragment>
          ))}
          <dt>{m.report.stars}</dt>
          <dd>{snap.display.stars ?? "?"}</dd>
        </dl>
        {(user.audience || user.knownFeatures) && (
          <div className="panel">
            <h3>{m.report.userInput}</h3>
            {user.audience && (
              <p>
                {m.form.audienceLabel}: {user.audience}
              </p>
            )}
            {user.knownFeatures && (
              <p>
                {m.form.featuresLabel}: {user.knownFeatures}
              </p>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="score-h" className="panel">
        <h2 id="score-h">{m.report.scoreHeading}</h2>
        <p>
          <strong>{scoreVerdict(s.value, lang)}</strong>
        </p>
        <p>
          {m.report.strengthsLabel}:{" "}
          {strengths(audit).length ? strengths(audit).map((f) => f.title).join(", ") : m.report.noStrengths}
        </p>
        <p className="muted">{m.report.scoreDisclaimer}</p>
        {s.value === null ? (
          <p>
            {m.report.scoreNone} ({m.report.rulesetVersion}: <code>{audit.rulesetVersion}</code>)
          </p>
        ) : (
          <div className="score">
            <span className="value">
              {s.value}
              <span className="visually-hidden"> / 100</span>
            </span>
            <span aria-hidden="true">/ 100</span>
            <span>
              {m.report.coverage}: {Math.round(s.coverage * 100)} %
            </span>
            <span>
              {m.report.rulesetVersion}: <code>{audit.rulesetVersion}</code>
            </span>
          </div>
        )}
        <p className="muted">{m.report.comparability}</p>
        <details>
          <summary>{m.report.calculation}</summary>
          <p>{s.formula}</p>
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">{m.report.calculation}</caption>
              <thead>
                <tr>
                  <th scope="col">{lang === "de" ? "Kategorie" : "Category"}</th>
                  <th scope="col">{lang === "de" ? "Erfüllt" : "Met"}</th>
                  <th scope="col">{lang === "de" ? "Bewertet" : "Scored"}</th>
                  <th scope="col">{lang === "de" ? "Unbekannt" : "Unknown"}</th>
                </tr>
              </thead>
              <tbody>
                {s.byCategory.map((c) => (
                  <tr key={c.category}>
                    <th scope="row">{m.categories[c.category]}</th>
                    <td>{c.achieved}</td>
                    <td>{c.possible}</td>
                    <td>{c.unknownWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <details>
          <summary>
            {m.report.excludedRules} ({s.excluded.length})
          </summary>
          <ul>
            {s.excluded.map((x) => (
              <li key={x.ruleId}>
                <code>{x.ruleId}</code>: {m.statuses[x.status]}. {x.reason}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section aria-labelledby="tasks-h">
        <h2 id="tasks-h">{m.report.tasksHeading}</h2>
        <p className="muted">{m.report.howToUse}</p>
        {audit.tasks.length < 5 && <p>{m.report.tasksFewer}</p>}
        <ol className="tasks">
          {audit.tasks.map((task) => (
            <li key={task.findingId}>
              <strong>{task.guide?.action ?? task.title}</strong> <span className="badge sev">{m.severities[task.severity]}</span>
              <br />
              {m.report.why}: {task.why}
              <br />
              {m.report.task}: {task.task}
              <br />
              <span className="muted">
                {m.report.effort}: {task.effort}
              </span>
              {task.guide && <GuideView g={task.guide} lang={lang} />}
              <span className="muted">
                {m.report.impact}: {task.impactHypothesis}
              </span>
              <br />
              <a href={`#finding-${task.findingId}`} onClick={(e) => jumpTo(e, `finding-${task.findingId}`)}>
                {m.report.evidence}: <code>{task.findingId}</code>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="findings-h">
        <h2 id="findings-h">{m.report.findingsHeading}</h2>
        {CATEGORY_ORDER.map((cat) => {
          const items = audit.findings.filter((f) => f.category === cat && f.scope !== "website");
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h3 id={`cat-${cat}`}>{m.categories[cat]}</h3>
              {items.map((f) => (
                <div key={f.id} id={`finding-${f.id}`}>
                  <FindingItem f={f} lang={lang} />
                </div>
              ))}
            </section>
          );
        })}
        {audit.findings.some((f) => f.scope === "website" && f.status !== "not_relevant") && (
          <section aria-labelledby="cat-website">
            <h3 id="cat-website">{m.report.websiteHeading}</h3>
            {audit.siteScope && <p className="muted">{siteScopeText(audit.siteScope, lang)}</p>}
            {audit.findings
              .filter((f) => f.scope === "website")
              .map((f) => (
                <div key={f.id} id={`finding-${f.id}`}>
                  <FindingItem f={f} lang={lang} />
                </div>
              ))}
          </section>
        )}
      </section>

      {(snap.notes.length > 0 || audit.injectionFlags.length > 0) && (
        <section aria-labelledby="notes-h">
          <h2 id="notes-h">{m.report.notes}</h2>
          {snap.notes.length > 0 && (
            <ul>
              {snap.notes.map((n, i) => (
                <li key={i}>{n[lang]}</li>
              ))}
            </ul>
          )}
          {audit.injectionFlags.length > 0 && (
            <div className="notice warn">
              <h3>{m.report.injectionHeading}</h3>
              <p>{m.report.injectionText}</p>
              <ul>
                {audit.injectionFlags.map((f, i) => (
                  <li key={i}>
                    <code>{f.path}</code> {m.report.lines} {f.line} ({f.pattern})<ScrollPre>{f.excerpt}</ScrollPre>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="money-h">
        <h2 id="money-h">{m.report.monetizationHeading}</h2>
        <p>{audit.monetization.summary}</p>
        <p className="notice">{audit.monetization.licenseNote}</p>
        {audit.monetization.options.map((o) => (
          <details key={o.type} className="finding">
            <summary>
              <span className={`badge ${o.fit === "good" ? "present" : o.fit === "conditional" ? "unknown" : "not_relevant"}`}>{m.report.fit[o.fit]}</span>
              <span>{o.title}</span>
            </summary>
            <div>
              <ul>
                {o.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <dl className="meta">
                <dt>{m.report.whoPays}</dt>
                <dd>{o.whoPays}</dd>
                <dt>{m.report.forWhat}</dt>
                <dd>{o.forWhat}</dd>
                <dt>{m.report.prerequisites}</dt>
                <dd>{o.prerequisites.join("; ")}</dd>
                <dt>{m.report.effort}</dt>
                <dd>{o.effort}</dd>
                <dt>{m.report.targetCustomers}</dt>
                <dd>{o.targetCustomers}</dd>
                <dt>{m.report.priceHypothesis}</dt>
                <dd>{o.priceHypothesis}</dd>
              </dl>
            </div>
          </details>
        ))}
        <ul className="muted">
          {audit.monetization.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="plan-h">
        <h2 id="plan-h">{m.report.launchPlanHeading}</h2>
        {([1, 2, 3, 4] as const).map((w) => {
          const tasks = audit.launchPlan.tasks.filter((x) => x.week === w);
          if (tasks.length === 0) return null;
          return (
            <div key={w}>
              <h3>
                {m.report.week} {w}
              </h3>
              <ul>
                {tasks.map((task, i) => (
                  <li key={i}>
                    <strong>{task.title}</strong> ({task.effort}): {task.why} <span className="muted">{m.report.signal}: {task.signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}
