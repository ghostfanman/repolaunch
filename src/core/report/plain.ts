// Verständliche Einordnung für Einsteiger: Score in Worten, Stärken und kurze Begriffserklärungen.
// Die Einordnung beschreibt nur den internen Score; sie ist keine Erfolgsprognose.

import type { AuditResult, Finding, Language } from "../types";

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
