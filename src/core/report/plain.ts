// Verständliche Einordnung für Einsteiger: Score in Worten, Stärken und kurze Begriffserklärungen.
// Die Einordnung beschreibt nur den internen Score; sie ist keine Erfolgsprognose.

import type { AuditResult, Finding, Language, PreviousAudit, RepoSnapshot, SiteScope } from "../types";

export function scoreVerdict(value: number | null, lang: Language): string {
  const de = lang === "de";
  if (value === null) return de ? "Nicht bewertbar: Es lagen zu wenige prüfbare Daten vor." : "Not scorable: too little checkable data was available.";
  if (value < 40) return de ? "Am Anfang: Wichtige Grundlagen fehlen noch. Die Aufgaben unten bringen am meisten." : "Early stage: important basics are still missing. The tasks below help most.";
  if (value < 70) return de ? "Solide Basis mit deutlichen Lücken. Die Aufgaben unten schließen die wichtigsten." : "Solid basis with clear gaps. The tasks below close the most important ones.";
  if (value < 90) return de ? "Gut vorbereitet. Einige Punkte fehlen noch." : "Well prepared. A few points are still missing.";
  return de ? "Sehr gut vorbereitet." : "Very well prepared.";
}

/** Erfüllte Prüfungen mit dem größten Gewicht. */
export function strengths(audit: AuditResult, max = 4): Finding[] {
  return audit.findings.filter((f) => f.status === "present").sort((a, b) => b.weight - a.weight).slice(0, max);
}

const GLOSSARY: { match: RegExp; term: Record<Language, string>; text: Record<Language, string> }[] = [
  { match: /\bREADME\b/i, term: { de: "README", en: "README" }, text: { de: "Die Startseite deines Projekts: die Datei README.md, die GitHub unter der Dateiliste anzeigt.", en: "Your project's front page: the README.md file GitHub shows below the file list." } },
  { match: /\bAbout\b/, term: { de: "About", en: "About" }, text: { de: "Der Kasten rechts oben auf der Repository-Seite mit Beschreibung, Website und Topics.", en: "The box at the top right of the repository page with description, website and topics." } },
  { match: /\bTopics?\b/i, term: { de: "Topics", en: "Topics" }, text: { de: "Schlagwörter, über die man dein Projekt in der GitHub-Suche und auf Themenseiten findet.", en: "Keywords that make your project findable in GitHub search and on topic pages." } },
  { match: /\bCommit/i, term: { de: "Commit", en: "Commit" }, text: { de: "Eine gespeicherte Änderung. „Commit changes“ speichert deine Bearbeitung im Repository.", en: "A saved change. “Commit changes” saves your edit in the repository." } },
  { match: /\bRelease/i, term: { de: "Release", en: "Release" }, text: { de: "Eine veröffentlichte Version deines Projekts mit Versionsnummer, z. B. v1.0.0.", en: "A published version of your project with a version number, e.g. v1.0.0." } },
  { match: /\bIssues?\b/i, term: { de: "Issue", en: "Issue" }, text: { de: "Ein Eintrag für Fragen, Fehler oder Ideen im Reiter „Issues“.", en: "An entry for questions, bugs or ideas in the “Issues” tab." } },
  { match: /\bPull Requests?\b/i, term: { de: "Pull Request", en: "Pull request" }, text: { de: "Ein Änderungsvorschlag, den andere einreichen und du prüfst und übernimmst.", en: "A proposed change that others submit and you review and merge." } },
  { match: /\bLi[cz]en[sz]/i, term: { de: "Lizenz", en: "License" }, text: { de: "Regelt, was andere mit deinem Code tun dürfen. Ohne Lizenz ist die Nutzung rechtlich unklar.", en: "Defines what others may do with your code. Without one, use is legally unclear." } },
  { match: /\bMarkdown\b|eckigen Klammern|square brackets/i, term: { de: "Markdown", en: "Markdown" }, text: { de: "Die einfache Textformatierung von GitHub: # für Überschriften, - für Listen, [Text](Adresse) für Links.", en: "GitHub's simple text formatting: # for headings, - for lists, [text](address) for links." } },
];

/** Begriffe, die im übergebenen Text vorkommen, mit kurzer Erklärung. */
export function glossaryFor(text: string, lang: Language): { term: string; text: string }[] {
  return GLOSSARY.filter((g) => g.match.test(text)).map((g) => ({ term: g.term[lang], text: g.text[lang] }));
}

/**
 * Konkreter Satz zu einer belegten früheren Analyse. Weicht die Regelwerkversion ab, sagt er ausdrücklich,
 * dass ein Unterschied auch vom Regelwerk stammen kann. Ohne frühere Analyse gibt es keinen Satz.
 */
export function previousAuditSentence(prev: PreviousAudit, current: { rulesetVersion: string; commitSha: string }, lang: Language): string {
  const de = lang === "de";
  const score = prev.score === null ? (de ? "ohne Score" : "without a score") : de ? `${prev.score} von 100 Punkten` : `${prev.score} out of 100 points`;
  const sameCommit = prev.commitSha !== null && prev.commitSha === current.commitSha;
  const commit = prev.commitSha ? (de ? `, Commit \`${prev.commitSha.slice(0, 7)}\`` : `, commit \`${prev.commitSha.slice(0, 7)}\``) : "";
  const head = de
    ? `Frühere Analyse dieses Repositorys (${prev.reference}, ${prev.date}): ${score} mit Regelwerk \`${prev.rulesetVersion}\`${commit}.`
    : `Earlier analysis of this repository (${prev.reference}, ${prev.date}): ${score} with ruleset \`${prev.rulesetVersion}\`${commit}.`;
  const outside = de ? "Angaben außerhalb des Commits (z. B. Beschreibung, Topics, Releases, Website)" : "information outside the commit (e.g. description, topics, releases, website)";
  if (prev.rulesetVersion !== current.rulesetVersion) {
    return de
      ? `${head} Das Regelwerk ist seitdem ein anderes (\`${current.rulesetVersion}\`): Ein Unterschied im Score kann auch vom Regelwerk stammen, nicht nur von Änderungen am Repository.${sameCommit ? ` Analysiert wurde derselbe Commit; ein Unterschied stammt daher aus dem Regelwerk oder aus ${outside}.` : ""}`
      : `${head} The ruleset has changed since (\`${current.rulesetVersion}\`): a difference in score may also come from the ruleset, not only from changes to the repository.${sameCommit ? ` The same commit was analysed; a difference therefore comes from the ruleset or from ${outside}.` : ""}`;
  }
  return de
    ? `${head} Gleiches Regelwerk, die Scores sind vergleichbar.${sameCommit ? ` Derselbe Commit; ein Unterschied stammt aus ${outside}.` : ""}`
    : `${head} Same ruleset, the scores are comparable.${sameCommit ? ` Same commit; a difference comes from ${outside}.` : ""}`;
}

/**
 * Getrennte Zähler: GitHub-API-Anfragen und Website-Abrufe, jeweils mit Anzahl und Bytes. Weiterleitungen
 * zählen als eigene Abrufe. Ohne Website-Abruf entfällt die zweite Zeile.
 */
export function requestLines(snapshot: Pick<RepoSnapshot, "stats" | "site">, lang: Language): { label: string; value: string }[] {
  const de = lang === "de";
  const st = snapshot.stats;
  const lines = [
    {
      label: "GitHub-API",
      value: de
        ? `${st.requests} ${st.requests === 1 ? "Anfrage" : "Anfragen"} (${st.notModified} × 304), ${st.bytes} B`
        : `${st.requests} ${st.requests === 1 ? "request" : "requests"} (${st.notModified} × 304), ${st.bytes} B`,
    },
  ];
  const site = snapshot.site;
  const n = site?.requests ?? 0;
  if (site && n > 0) {
    const hops = site.redirects?.length ?? 0;
    const redirects = hops > 0 ? (de ? ` (davon ${hops} ${hops === 1 ? "Weiterleitung" : "Weiterleitungen"})` : ` (${hops} of them ${hops === 1 ? "a redirect" : "redirects"})`) : "";
    lines.push({
      label: "Website",
      value: de
        ? `${n} ${n === 1 ? "Abruf" : "Abrufe"}${redirects}, ${site.transferBytes ?? 0} B übertragen`
        : `${n} ${n === 1 ? "fetch" : "fetches"}${redirects}, ${site.transferBytes ?? 0} B transferred`,
    });
  }
  return lines;
}

/** Grenze der Website-Prüfung: genau eine Seite; weitere README-Links derselben Website werden nur gezählt. */
export function siteScopeText(scope: SiteScope, lang: Language): string {
  const de = lang === "de";
  const n = scope.uncheckedReadmeLinks.length;
  const redirected = scope.finalUrl && scope.finalUrl !== scope.url ? (de ? ` Gelesen nach Weiterleitung: ${scope.finalUrl}.` : ` Read after redirect: ${scope.finalUrl}.`) : "";
  const more =
    n > 0
      ? de
        ? ` Die README verlinkt ${n} weitere ${n === 1 ? "Seite" : "Seiten"} derselben Website; ${n === 1 ? "sie wurde" : "sie wurden"} nicht geprüft.`
        : ` The README links ${n} more ${n === 1 ? "page" : "pages"} of the same website; ${n === 1 ? "it was" : "they were"} not checked.`
      : "";
  return de
    ? `Geprüft wurde genau eine Seite: die Adresse aus dem Website-Feld (${scope.url}), ohne JavaScript und ohne Unterseiten.${redirected}${more}`
    : `Exactly one page was checked: the address from the website field (${scope.url}), without JavaScript and without subpages.${redirected}${more}`;
}
