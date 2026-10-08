// Schritt-für-Schritt-Anleitungen für Einsteiger. Jede offene Aufgabe lässt sich damit ohne Terminal
// direkt auf der GitHub-Webseite erledigen. Vorlagen enthalten nur Platzhalter in eckigen Klammern und
// Fakten, die feststehen (Repository-Name, Adressen); nichts über Funktionen, Befehle oder Kunden wird erfunden.

import type { ManifestInfo } from "../analysis/manifests";
import type { GuideStep, Language, ProjectType, RepoSnapshot, TaskGuide } from "../types";

export interface GuideContext {
  snapshot: RepoSnapshot;
  lang: Language;
  readmePath: string | null;
  projectType: ProjectType;
  manifests: ManifestInfo[];
}

/** Längere Vorlagen werden nicht in die Adresse gepackt (Browser- und GitHub-Grenzen). */
const MAX_PREFILL_URL = 6000;

function urls(s: RepoSnapshot) {
  const repo = `https://github.com/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}`;
  const branch = s.defaultBranch.split("/").map(encodeURIComponent).join("/");
  const path = (p: string) => p.split("/").map(encodeURIComponent).join("/");
  return {
    repo,
    settings: `${repo}/settings`,
    edit: (file: string) => `${repo}/edit/${branch}/${path(file)}`,
    newFile: (file: string, value?: string) => {
      const base = `${repo}/new/${branch}?filename=${encodeURIComponent(file)}`;
      if (!value) return base;
      // Klammern ebenfalls kodieren, damit die Adresse auch als Markdown-Linkziel eindeutig bleibt.
      const full = `${base}&value=${encodeURIComponent(value).replace(/[()!'*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
      return full.length <= MAX_PREFILL_URL ? full : base;
    },
  };
}

/** Vorschläge für Topics, nur aus erkannten Daten abgeleitet (Projekttyp, Manifeste). */
export function suggestTopics(ctx: GuideContext): string[] {
  const out: string[] = [];
  const byType: Record<ProjectType, string[]> = { cli: ["cli", "command-line-tool"], library: ["library"], webapp: ["web-app"], template: ["template"], other: [] };
  out.push(...byType[ctx.projectType]);
  const byEco: Record<ManifestInfo["ecosystem"], string> = { npm: "javascript", python: "python", cargo: "rust", go: "go", composer: "php", "github-action": "github-actions" };
  for (const m of ctx.manifests) out.push(byEco[m.ecosystem]);
  if (ctx.manifests.some((m) => m.ecosystem === "npm" && m.dependencies.includes("typescript"))) out.push("typescript");
  const existing = new Set(ctx.snapshot.meta.topics.map((x) => x.toLowerCase()));
  return [...new Set(out)].filter((x) => /^[a-z0-9][a-z0-9-]{0,49}$/.test(x) && !existing.has(x));
}

type Builder = (ctx: GuideContext, L: (de: string, en: string) => string, u: ReturnType<typeof urls>, variant?: string) => TaskGuide;

function commitStep(L: (de: string, en: string) => string): GuideStep {
  return { text: L("Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.", "Click “Commit changes…” at the top right and then “Commit changes” in the dialog. Done.") };
}

function aboutSteps(L: (de: string, en: string) => string, u: ReturnType<typeof urls>, field: string, what: string): GuideStep[] {
  return [
    { text: L("Öffne die Startseite deines Repositories:", "Open the main page of your repository:"), link: { label: L("Repository öffnen", "Open repository"), url: u.repo } },
    { text: L("Klicke rechts neben der Überschrift „About“ auf das Zahnrad-Symbol (⚙).", "Click the gear icon (⚙) to the right of the “About” heading.") },
    { text: L(`Trage im Feld „${field}“ ${what} ein.`, `Enter ${what} in the “${field}” field.`) },
    { text: L("Klicke auf „Save changes“. Die Änderung ist sofort sichtbar.", "Click “Save changes”. The change is visible immediately.") },
  ];
}

/** README-Abschnitt ergänzen: Editor öffnen, Vorlage einfügen, Platzhalter ersetzen, speichern. */
function readmeGuide(ctx: GuideContext, L: (de: string, en: string) => string, u: ReturnType<typeof urls>, action: string, where: string, template: string, note?: string): TaskGuide {
  const file = ctx.readmePath ?? "README.md";
  return {
    action,
    steps: [
      { text: L("Öffne die README im Bearbeitungsmodus:", "Open the README in edit mode:"), link: { label: L("README bearbeiten", "Edit README"), url: u.edit(file) } },
      { text: where },
      { text: L("Kopiere die Vorlage unten an diese Stelle und ersetze alles in eckigen Klammern [ ] durch deine eigenen Angaben.", "Copy the template below to that place and replace everything in square brackets [ ] with your own details.") },
      { text: L("Prüfe das Ergebnis über den Reiter „Preview“ oben im Editor.", "Check the result with the “Preview” tab above the editor.") },
      commitStep(L),
    ],
    template: { label: L("Vorlage zum Kopieren", "Template to copy"), content: template },
    note,
  };
}

/** Neue Datei mit vorausgefüllter Vorlage anlegen. */
function newFileGuide(L: (de: string, en: string) => string, u: ReturnType<typeof urls>, action: string, filename: string, template: string, extraSteps: GuideStep[] = [], note?: string): TaskGuide {
  const createUrl = u.newFile(filename, template);
  return {
    action,
    steps: [
      ...extraSteps,
      { text: L(`Öffne die neue Datei ${filename}. Die Vorlage ist bereits eingefügt:`, `Open the new file ${filename}. The template is already filled in:`), link: { label: L(`${filename} anlegen`, `Create ${filename}`), url: createUrl } },
      { text: L("Ersetze alles in eckigen Klammern [ ] durch deine eigenen Angaben und lösche, was nicht passt.", "Replace everything in square brackets [ ] with your own details and delete what does not apply.") },
      commitStep(L),
    ],
    template: { label: L("Inhalt der Vorlage", "Template content"), content: template, filename, createUrl },
    note,
  };
}

/** Startdatei der Website im Repository, wenn die Website über GitHub Pages des Besitzers aus diesem Repository kommt. */
function siteEntryFile(ctx: GuideContext): string | null {
  const site = ctx.snapshot.site;
  const target = site?.finalUrl ?? site?.url;
  if (!target) return null;
  try {
    const u = new URL(target);
    const pagesHost = `${ctx.snapshot.owner}.github.io`.toLowerCase();
    if (u.hostname.toLowerCase() !== pagesHost) return null;
    // Projektseite: erster Pfadteil ist der Repository-Name; Benutzerseite: Repository heißt owner.github.io
    const first = decodeURIComponent(u.pathname.split("/")[1] ?? "").toLowerCase();
    const repo = ctx.snapshot.repo.toLowerCase();
    if (first !== repo && repo !== pagesHost) return null;
  } catch {
    return null;
  }
  const files = new Set(ctx.snapshot.tree.entries.filter((e) => e.type === "blob").map((e) => e.path));
  return ["index.html", "docs/index.html"].find((f) => files.has(f)) ?? null;
}

/** Erster Schritt der Website-Anleitungen: Startdatei öffnen, direkt im Editor, wenn sie im Repository liegt. */
function siteEditStep(ctx: GuideContext, L: (de: string, en: string) => string, u: ReturnType<typeof urls>): GuideStep {
  const file = siteEntryFile(ctx);
  if (file) return { text: L(`Die Website kommt aus diesem Repository. Öffne die Startdatei ${file} im Bearbeitungsmodus:`, `The website is served from this repository. Open the start file ${file} in edit mode:`), link: { label: L(`${file} bearbeiten`, `Edit ${file}`), url: u.edit(file) } };
  return { text: L("Öffne die Startdatei deiner Website, meist index.html, oder bei Frameworks die Stelle für Seitentitel und Metadaten.", "Open the start file of your website, usually index.html, or with frameworks the place for page title and metadata.") };
}

const LEGAL_GUIDE_NOTE = {
  de: "RepoLaunch erstellt keine Inhalte für Impressum oder Datenschutzerklärung und prüft sie nicht. Das ist ein Hinweis, keine Rechtsberatung; im Zweifel rechtlich beraten lassen.",
  en: "RepoLaunch does not create or review content for a legal notice or privacy policy. This is a hint, not legal advice; seek legal advice if in doubt.",
};

const NO_TERMINAL_NOTE = {
  de: "Trage nur Befehle ein, die du selbst ausprobiert hast. RepoLaunch erfindet keine Befehle.",
  en: "Only enter commands you have tried yourself. RepoLaunch does not invent commands.",
};

const HEAD_STEP = {
  de: "Füge die Vorlage im Bereich zwischen <head> und </head> ein und ersetze alles in eckigen Klammern [ ].",
  en: "Insert the template between <head> and </head> and replace everything in square brackets [ ].",
};

const GUIDES: Record<string, Builder> = {
  "understanding.description": (ctx, L, u) => ({
    action: L("Beschreibung in einem Satz formulieren", "Write a one-sentence description"),
    steps: aboutSteps(L, u, "Description", L("einen Satz nach der Vorlage unten", "one sentence following the template below")),
    template: {
      label: L("Satzbaustein (Platzhalter ersetzen)", "Sentence pattern (replace placeholders)"),
      content: L(
        `${ctx.snapshot.repo} ist ein [Art: z. B. Kommandozeilen-Werkzeug, Bibliothek, Web-App] für [Zielgruppe], das [konkreter Nutzen].`,
        `${ctx.snapshot.repo} is a [kind: e.g. command-line tool, library, web app] for [audience] that [concrete benefit].`,
      ),
    },
    note: L("Gut sind 60 bis 160 Zeichen. Nenne Nutzen statt Technik.", "60 to 160 characters work well. Name the benefit, not the technology."),
  }),

  "understanding.readme": (ctx, L, u) =>
    newFileGuide(
      L,
      u,
      L("README.md mit Vorlage anlegen", "Create README.md from a template"),
      "README.md",
      L(
        `# ${ctx.snapshot.repo}\n\n[Ein bis zwei Sätze: Welches Problem löst das Projekt, für wen, mit welchem Nutzen?]\n\n## Funktionen\n\n- [Funktion 1]\n- [Funktion 2]\n- [Funktion 3]\n\n## Voraussetzungen\n\n- [Benötigte Software und Mindestversion]\n\n## Installation\n\n\`\`\`\n[Der genaue Befehl oder die Schritte zur Installation]\n\`\`\`\n\n## Verwendung\n\n[Ein kurzes Beispiel und was dabei herauskommt]\n\n## Fragen und Mitmachen\n\nFragen, Fehler und Ideen bitte als [Issue](${u.repo}/issues) melden.\n\n## Lizenz\n\n[Name der Lizenz, siehe Datei LICENSE]\n`,
        `# ${ctx.snapshot.repo}\n\n[One or two sentences: which problem does the project solve, for whom, with what benefit?]\n\n## Features\n\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n\n## Requirements\n\n- [Required software and minimum version]\n\n## Installation\n\n\`\`\`\n[The exact command or steps to install]\n\`\`\`\n\n## Usage\n\n[A short example and what it produces]\n\n## Questions and contributing\n\nPlease report questions, bugs and ideas as an [issue](${u.repo}/issues).\n\n## License\n\n[Name of the license, see the LICENSE file]\n`,
      ),
      [],
      NO_TERMINAL_NOTE[ctx.lang],
    ),

  "understanding.intro": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Einleitung unter den Titel schreiben", "Write an introduction below the title"),
      L("Setze den Cursor direkt unter die erste Überschrift (die Zeile mit #).", "Place the cursor directly below the first heading (the line starting with #)."),
      L(
        `${ctx.snapshot.repo} hilft [Zielgruppe], [Problem] zu lösen. [Ein Satz, wie es das tut und was danach besser ist.]`,
        `${ctx.snapshot.repo} helps [audience] solve [problem]. [One sentence on how it does that and what is better afterwards.]`,
      ),
    ),

  "understanding.audience": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Abschnitt „Für wen“ und „Funktionen“ ergänzen", "Add “Who it is for” and “Features” sections"),
      L("Setze den Cursor unter die Einleitung, vor die Installation.", "Place the cursor below the introduction, before the installation section."),
      L(
        `## Für wen ist ${ctx.snapshot.repo}?\n\n- [Zielgruppe 1, z. B. „Teams, die …“]\n- [Zielgruppe 2]\n\n## Funktionen\n\n- [Konkrete Funktion 1]\n- [Konkrete Funktion 2]\n- [Konkrete Funktion 3]`,
        `## Who is ${ctx.snapshot.repo} for?\n\n- [Audience 1, e.g. “teams that …”]\n- [Audience 2]\n\n## Features\n\n- [Concrete feature 1]\n- [Concrete feature 2]\n- [Concrete feature 3]`,
      ),
      L("Nenne nur Funktionen, die es wirklich gibt.", "Only list features that really exist."),
    ),

  "understanding.example": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Ein kurzes Beispiel zeigen", "Show a short example"),
      L("Setze den Cursor unter den Abschnitt zur Installation.", "Place the cursor below the installation section."),
      L(
        "## Beispiel\n\n```\n[Ein kurzer Befehl oder Code, den man direkt ausprobieren kann]\n```\n\nErgebnis:\n\n```\n[Was dabei herauskommt]\n```",
        "## Example\n\n```\n[A short command or snippet people can try right away]\n```\n\nResult:\n\n```\n[What it produces]\n```",
      ),
      NO_TERMINAL_NOTE[ctx.lang],
    ),

  "usability.quickstart": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Schnellstart mit genauen Schritten ergänzen", "Add a quick start with exact steps"),
      L("Setze den Cursor unter die Einleitung.", "Place the cursor below the introduction."),
      L(
        "## Schnellstart\n\n1. [Was man zuerst installieren oder herunterladen muss]\n2. [Der genaue Befehl zum Installieren oder Starten]\n3. [Woran man erkennt, dass es funktioniert]",
        "## Quick start\n\n1. [What to install or download first]\n2. [The exact command to install or start]\n3. [How to tell that it works]",
      ),
      NO_TERMINAL_NOTE[ctx.lang],
    ),

  "usability.prerequisites": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Voraussetzungen vor der Installation nennen", "List the requirements before installation"),
      L("Setze den Cursor direkt über den Abschnitt zur Installation.", "Place the cursor directly above the installation section."),
      L(
        "## Voraussetzungen\n\n- [Software, z. B. Node.js, Python oder Docker] ab Version [Mindestversion]\n- [Betriebssystem, falls relevant]",
        "## Requirements\n\n- [Software, e.g. Node.js, Python or Docker] version [minimum version] or newer\n- [Operating system, if relevant]",
      ),
    ),

  "usability.visual_demo": (ctx, L, u, variant) => ({
    action: L("Screenshot in die README einfügen", "Add a screenshot to the README"),
    steps: [
      { text: L("Mache einen Screenshot deines Projekts (Windows: Win+Umschalt+S, Mac: Cmd+Umschalt+4, Linux: Taste „Druck“).", "Take a screenshot of your project (Windows: Win+Shift+S, Mac: Cmd+Shift+4, Linux: “Print” key).") },
      { text: L("Öffne die README im Bearbeitungsmodus:", "Open the README in edit mode:"), link: { label: L("README bearbeiten", "Edit README"), url: u.edit(ctx.readmePath ?? "README.md") } },
      {
        text:
          variant === "screenshot_only"
            ? L("Klicke in die Zeile unter dem vorhandenen Demo-Link und ziehe die Bilddatei in das Textfeld. GitHub lädt das Bild hoch und fügt den Link selbst ein.", "Click into the line below the existing demo link and drag the image file into the text field. GitHub uploads the image and inserts the link for you.")
            : L("Klicke unter die Einleitung und ziehe die Bilddatei in das Textfeld. GitHub lädt das Bild hoch und fügt den Link selbst ein.", "Click below the introduction and drag the image file into the text field. GitHub uploads the image and inserts the link for you."),
      },
      { text: L("Ersetze den Text in den eckigen Klammern des Bild-Links durch eine kurze Beschreibung, z. B. „Startseite der App“.", "Replace the text in the square brackets of the image link with a short description, e.g. “App start page”.") },
      commitStep(L),
    ],
    // Ein Demo-Link allein erfüllt die Regel nicht (siehe usability.visual_demo@2); er ist nur eine Ergänzung.
    note:
      variant === "screenshot_only"
        ? undefined
        : L("Gibt es eine laufende Demo, verlinke sie zusätzlich direkt unter dem Bild.", "If there is a running demo, also link it right below the image."),
  }),

  "usability.docs": (ctx, L, u) =>
    newFileGuide(
      L,
      u,
      L("Dokumentationsseite anlegen und verlinken", "Create a documentation page and link it"),
      "docs/README.md",
      L(
        `# Dokumentation für ${ctx.snapshot.repo}\n\n## Erste Schritte\n\n[Wie man anfängt]\n\n## Konfiguration\n\n[Welche Einstellungen es gibt]\n\n## Häufige Fragen\n\n[Frage und Antwort]\n`,
        `# Documentation for ${ctx.snapshot.repo}\n\n## Getting started\n\n[How to get started]\n\n## Configuration\n\n[Which settings exist]\n\n## FAQ\n\n[Question and answer]\n`,
      ),
      [],
      L("Verlinke die Seite danach in der README, z. B. mit der Zeile: Ausführliche Dokumentation: [docs/README.md](docs/README.md)", "Afterwards link the page in the README, e.g. with the line: Full documentation: [docs/README.md](docs/README.md)"),
    ),

  "usability.cli_reference": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Übersicht der Befehle ergänzen", "Add an overview of the commands"),
      L("Setze den Cursor unter das Beispiel oder den Schnellstart.", "Place the cursor below the example or the quick start."),
      L(
        "## Befehle\n\n| Befehl | Was er tut |\n| --- | --- |\n| `[befehl]` | [Beschreibung] |\n| `[befehl] [option]` | [Beschreibung] |",
        "## Commands\n\n| Command | What it does |\n| --- | --- |\n| `[command]` | [description] |\n| `[command] [option]` | [description] |",
      ),
      NO_TERMINAL_NOTE[ctx.lang],
    ),

  "usability.api_reference": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Die wichtigsten Funktionen beschreiben", "Describe the most important functions"),
      L("Setze den Cursor unter das Beispiel.", "Place the cursor below the example."),
      L(
        "## API\n\n### `[funktionsName]([parameter])`\n\n[Was die Funktion tut.]\n\n- `[parameter]`: [Bedeutung]\n- Rückgabe: [Was zurückkommt]",
        "## API\n\n### `[functionName]([parameter])`\n\n[What the function does.]\n\n- `[parameter]`: [meaning]\n- Returns: [what comes back]",
      ),
    ),

  "usability.template_flag": (_ctx, L, u) => ({
    action: L("Als Vorlage freischalten", "Mark as template repository"),
    steps: [
      { text: L("Öffne die Einstellungen des Repositories:", "Open the repository settings:"), link: { label: L("Einstellungen öffnen", "Open settings"), url: u.settings } },
      { text: L("Setze direkt unter dem Repository-Namen den Haken bei „Template repository“. Die Einstellung wird sofort gespeichert.", "Tick “Template repository” directly below the repository name. The setting is saved immediately.") },
      { text: L("Ab jetzt zeigt GitHub den Knopf „Use this template“ an.", "GitHub now shows the “Use this template” button.") },
    ],
  }),

  "trust.license": (_ctx, L, u) => ({
    action: L("Lizenzdatei über GitHubs Auswahl anlegen", "Add a license file using GitHub's picker"),
    steps: [
      { text: L("Öffne eine neue Datei namens LICENSE:", "Open a new file named LICENSE:"), link: { label: L("LICENSE anlegen", "Create LICENSE"), url: u.newFile("LICENSE") } },
      { text: L("Klicke rechts auf „Choose a license template“. GitHub zeigt zu jeder Lizenz, was andere damit dürfen und welche Bedingungen gelten.", "Click “Choose a license template” on the right. GitHub shows what others may do under each license and which conditions apply.") },
      { text: L("Wähle eine Lizenz, klicke auf „Review and submit“ und dann auf „Commit changes“.", "Choose a license, click “Review and submit” and then “Commit changes”.") },
    ],
    note: L(
      "Keine Rechtsberatung: RepoLaunch wählt keine Lizenz für dich und ändert nichts automatisch. Im Zweifel rechtlich beraten lassen.",
      "Not legal advice: RepoLaunch does not choose a license for you and changes nothing automatically. If in doubt, get legal advice.",
    ),
  }),

  "trust.maintenance": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Zeigen, ob das Projekt gepflegt wird", "Show whether the project is maintained"),
      L("Setze den Cursor direkt unter die erste Überschrift.", "Place the cursor directly below the first heading."),
      L(
        "> **Status:** [Aktiv gepflegt / Nur Fehlerbehebungen / Nicht mehr gepflegt]. [Optional: Hinweis auf eine Alternative]",
        "> **Status:** [Actively maintained / Bug fixes only / No longer maintained]. [Optional: pointer to an alternative]",
      ),
      L(
        "Wenn du weiter daran arbeitest, zeigt auch ein neues Release den aktuellen Stand. Wird es nicht mehr gepflegt, kannst du es unter Einstellungen → „Archive this repository“ archivieren (umkehrbar).",
        "If you keep working on it, a new release also shows the current state. If it is no longer maintained, you can archive it under Settings → “Archive this repository” (reversible).",
      ),
    ),

  "trust.releases": (_ctx, L, u) => ({
    action: L("Erstes Release veröffentlichen", "Publish a first release"),
    steps: [
      { text: L("Öffne die Seite für ein neues Release:", "Open the page for a new release:"), link: { label: L("Neues Release", "New release"), url: `${u.repo}/releases/new` } },
      { text: L("Klicke auf „Choose a tag“, tippe eine Versionsnummer ein, z. B. v0.1.0, und wähle „Create new tag“.", "Click “Choose a tag”, type a version number such as v0.1.0 and choose “Create new tag”.") },
      { text: L("Klicke auf „Generate release notes“. GitHub schreibt die Änderungen selbst zusammen; prüfe und ergänze den Text.", "Click “Generate release notes”. GitHub summarises the changes for you; check and extend the text.") },
      { text: L("Klicke auf „Publish release“.", "Click “Publish release”.") },
    ],
    note: L("Eine Versionsnummer wie v0.1.0 signalisiert eine frühe Version, v1.0.0 eine stabile.", "A version like v0.1.0 signals an early version, v1.0.0 a stable one."),
  }),

  "trust.contributing": (ctx, L, u) =>
    newFileGuide(
      L,
      u,
      L("CONTRIBUTING.md mit Vorlage anlegen", "Create CONTRIBUTING.md from a template"),
      "CONTRIBUTING.md",
      L(
        `# Mitmachen bei ${ctx.snapshot.repo}\n\nDanke für dein Interesse! So kannst du beitragen:\n\n## Fehler melden und Ideen vorschlagen\n\nÖffne ein [Issue](${u.repo}/issues) und beschreibe, was passiert ist und was du erwartet hast.\n\n## Entwicklungsumgebung einrichten\n\n1. [Repository forken und herunterladen]\n2. [Befehl zum Installieren der Abhängigkeiten]\n3. [Befehl zum Starten der Tests]\n\n## Pull Requests\n\n- [Regeln, z. B. ein Thema pro Pull Request, Tests ergänzen]\n- [Code-Stil oder Formatierungswerkzeug]\n`,
        `# Contributing to ${ctx.snapshot.repo}\n\nThanks for your interest! Here is how to contribute:\n\n## Reporting bugs and suggesting ideas\n\nOpen an [issue](${u.repo}/issues) and describe what happened and what you expected.\n\n## Setting up the development environment\n\n1. [Fork and download the repository]\n2. [Command to install dependencies]\n3. [Command to run the tests]\n\n## Pull requests\n\n- [Rules, e.g. one topic per pull request, add tests]\n- [Code style or formatter]\n`,
      ),
      [],
      NO_TERMINAL_NOTE[ctx.lang],
    ),

  "trust.security_policy": (ctx, L, u) =>
    newFileGuide(
      L,
      u,
      L("Sicherheitsrichtlinie mit Meldeweg anlegen", "Create a security policy with a reporting channel"),
      "SECURITY.md",
      L(
        `# Sicherheitsrichtlinie\n\n## Sicherheitslücke melden\n\nBitte melde Sicherheitslücken nicht öffentlich als Issue, sondern vertraulich über [Report a vulnerability](${u.repo}/security/advisories/new).\n\n## Unterstützte Versionen\n\n| Version | Unterstützt |\n| --- | --- |\n| [z. B. 1.x] | ja |\n| [ältere Versionen] | nein |\n\n## Reaktionszeit\n\nIch bemühe mich, innerhalb von [Zeitraum, z. B. 14 Tagen] zu antworten. Das ist keine Garantie.\n`,
        `# Security policy\n\n## Reporting a vulnerability\n\nPlease do not report vulnerabilities as public issues. Report them privately via [Report a vulnerability](${u.repo}/security/advisories/new).\n\n## Supported versions\n\n| Version | Supported |\n| --- | --- |\n| [e.g. 1.x] | yes |\n| [older versions] | no |\n\n## Response time\n\nI try to respond within [time frame, e.g. 14 days]. This is not a guarantee.\n`,
      ),
      [
        {
          text: L(
            "Schalte zuerst vertrauliche Meldungen ein: Einstellungen → „Advanced Security“ (je nach Ansicht „Code security“) → bei „Private vulnerability reporting“ auf „Enable“ klicken.",
            "First enable private reports: Settings → “Advanced Security” (or “Code security”, depending on the view) → click “Enable” next to “Private vulnerability reporting”.",
          ),
          link: { label: L("Sicherheitseinstellungen", "Security settings"), url: `${u.settings}/security_analysis` },
        },
      ],
    ),

  "trust.contact": (ctx, L, u) => ({
    action: L("Weg für Fragen und Fehlerberichte öffnen", "Open a channel for questions and bug reports"),
    steps: [
      { text: L("Öffne die Einstellungen des Repositories:", "Open the repository settings:"), link: { label: L("Einstellungen öffnen", "Open settings"), url: u.settings } },
      { text: L("Scrolle zum Abschnitt „Features“ und setze den Haken bei „Issues“. Für offene Fragen eignet sich zusätzlich „Discussions“.", "Scroll to the “Features” section and tick “Issues”. “Discussions” additionally suit open questions.") },
      { text: L("Optional: Füge die Vorlage unten in die README ein, damit Besucher den Weg finden.", "Optional: add the template below to the README so visitors find the way."), link: { label: L("README bearbeiten", "Edit README"), url: u.edit(ctx.readmePath ?? "README.md") } },
    ],
    template: {
      label: L("Vorlage für die README", "Template for the README"),
      content: L(`## Hilfe und Kontakt\n\nFragen und Fehlerberichte bitte als [Issue](${u.repo}/issues) stellen.`, `## Help and contact\n\nPlease ask questions and report bugs as an [issue](${u.repo}/issues).`),
    },
  }),

  "trust.code_of_conduct": (_ctx, L, u) => ({
    action: L("Verhaltenskodex über GitHubs Vorlage anlegen", "Add a code of conduct using GitHub's template"),
    steps: [
      { text: L("Öffne eine neue Datei namens CODE_OF_CONDUCT.md:", "Open a new file named CODE_OF_CONDUCT.md:"), link: { label: L("CODE_OF_CONDUCT.md anlegen", "Create CODE_OF_CONDUCT.md"), url: u.newFile("CODE_OF_CONDUCT.md") } },
      { text: L("Klicke rechts auf „Choose a code of conduct template“ und wähle eine Vorlage, z. B. „Contributor Covenant“.", "Click “Choose a code of conduct template” on the right and pick one, e.g. “Contributor Covenant”.") },
      { text: L("Trage eine Kontaktadresse für Meldungen ein, klicke auf „Review and submit“ und dann auf „Commit changes“.", "Enter a contact address for reports, click “Review and submit” and then “Commit changes”.") },
    ],
  }),

  "trust.changelog": (ctx, L, u) =>
    newFileGuide(
      L,
      u,
      L("Änderungen nachvollziehbar machen", "Make changes traceable"),
      "CHANGELOG.md",
      L(
        `# Änderungsprotokoll\n\nAlle wichtigen Änderungen an ${ctx.snapshot.repo} stehen in dieser Datei.\n\n## Unveröffentlicht\n\n### Neu\n\n- [Neue Funktion]\n\n### Geändert\n\n- [Änderung]\n\n### Behoben\n\n- [Fehlerbehebung]\n`,
        `# Changelog\n\nAll notable changes to ${ctx.snapshot.repo} are documented in this file.\n\n## Unreleased\n\n### Added\n\n- [New feature]\n\n### Changed\n\n- [Change]\n\n### Fixed\n\n- [Bug fix]\n`,
      ),
      [],
      L("Einfachste Alternative: Bei jedem Release auf „Generate release notes“ klicken. Dann ist keine eigene Datei nötig.", "Simplest alternative: click “Generate release notes” for every release. Then no separate file is needed."),
    ),

  "distribution.topics": (ctx, L, u) => {
    const suggestions = suggestTopics(ctx);
    return {
      action: L("Topics (Schlagwörter) vergeben", "Add topics (keywords)"),
      steps: [
        ...aboutSteps(L, u, "Topics", L("drei bis acht Schlagwörter (nach jedem Wort Enter drücken; GitHub schlägt passende vor)", "three to eight keywords (press Enter after each word; GitHub suggests matching ones)")),
      ],
      template: suggestions.length
        ? { label: L("Vorschläge aus erkannten Daten (bitte prüfen und um das Problemfeld ergänzen)", "Suggestions from detected data (please check and add the problem domain)"), content: suggestions.join(" ") }
        : undefined,
      note: L("Gute Topics beschreiben Sprache, Problemfeld und Art des Projekts, z. B. „pdf“, „invoices“, „cli“.", "Good topics describe language, problem domain and kind of project, e.g. “pdf”, “invoices”, “cli”."),
    };
  },

  "distribution.homepage": (_ctx, L, u) => ({
    action: L("Website im About-Bereich eintragen", "Add a website in the About box"),
    steps: aboutSteps(L, u, "Website", L("die Adresse deiner Demo, Doku oder Produktseite", "the address of your demo, docs or product page")),
    note: L(
      "Noch keine Website? GitHub Pages ist kostenlos (Einstellungen → „Pages“). Sonst das Feld leer lassen, bis es eine passende Seite gibt.",
      "No website yet? GitHub Pages is free (Settings → “Pages”). Otherwise leave the field empty until a suitable page exists.",
    ),
  }),

  "distribution.next_step": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Nächsten Schritt ganz oben verlinken", "Link the next step at the very top"),
      L("Setze den Cursor direkt unter die Einleitung.", "Place the cursor directly below the introduction."),
      L("**Loslegen:** [Installation](#installation) · **Demo:** [Adresse deiner Demo, falls vorhanden]", "**Get started:** [Installation](#installation) · **Demo:** [address of your demo, if any]"),
      L("Passe „#installation“ an die Überschrift an, unter der in deiner README die Installation steht (klein geschrieben, Leerzeichen als Bindestrich).", "Adjust “#installation” to the heading of your installation section (lower case, spaces as hyphens)."),
    ),

  "distribution.registry": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Paketseite in der README verlinken", "Link the package page in the README"),
      L("Setze den Cursor in den Abschnitt zur Installation.", "Place the cursor in the installation section."),
      L("Paket: [Adresse der Paketseite, z. B. auf npmjs.com, pypi.org oder crates.io]", "Package: [address of the package page, e.g. on npmjs.com, pypi.org or crates.io]"),
      L("Ist das Projekt noch in keinem Paketregister veröffentlicht, prüfe zuerst, ob eine Veröffentlichung für deine Nutzer sinnvoll ist.", "If the project is not published to a registry yet, first check whether publishing makes sense for your users."),
    ),

  "distribution.funding": (ctx, L, u) =>
    newFileGuide(
      L,
      u,
      L("Sponsor-Knopf einrichten", "Set up the sponsor button"),
      ".github/FUNDING.yml",
      L(
        `# Nicht genutzte Zeilen löschen. github: nur, wenn GitHub Sponsors für dieses Konto aktiv ist.\ngithub: [${ctx.snapshot.owner}]\n# ko_fi: [DEIN-KO-FI-NAME]\n# custom: ["https://[DEINE-SPENDENSEITE]"]\n`,
        `# Delete unused lines. github: only if GitHub Sponsors is active for this account.\ngithub: [${ctx.snapshot.owner}]\n# ko_fi: [YOUR-KO-FI-NAME]\n# custom: ["https://[YOUR-DONATION-PAGE]"]\n`,
      ),
      [
        {
          text: L("Falls noch nicht geschehen: Bei GitHub Sponsors anmelden. Die Teilnahme ist nicht in jedem Land möglich und wird von GitHub geprüft.", "If not done yet: sign up for GitHub Sponsors. Participation is not available in every country and is reviewed by GitHub."),
          link: { label: "GitHub Sponsors", url: "https://github.com/sponsors" },
        },
      ],
      L("Danach erscheint auf der Repository-Seite der Knopf „Sponsor“.", "Afterwards the “Sponsor” button appears on the repository page."),
    ),

  "distribution.commercial_offer": (ctx, L, u) =>
    readmeGuide(
      ctx,
      L,
      u,
      L("Bezahltes Angebot in der README nennen", "Mention a paid offer in the README"),
      L("Setze den Cursor ans Ende der README, vor die Lizenz.", "Place the cursor at the end of the README, before the license."),
      L(
        "## Support und kommerzielle Nutzung\n\nDu brauchst Hilfe bei Einrichtung, Anpassung oder Betrieb? [Was du anbietest, z. B. Einrichtung, Schulung, Wartung]\n\nKontakt: [E-Mail-Adresse oder Link]",
        "## Support and commercial use\n\nNeed help with setup, customisation or operations? [What you offer, e.g. setup, training, maintenance]\n\nContact: [email address or link]",
      ),
      L("Nenne nur Leistungen, die du wirklich anbietest, und versprich keine Ergebnisse.", "Only list services you really offer, and do not promise results."),
    ),

  "distribution.contributor_entry": (_ctx, L, u) => ({
    action: L("Einstiegsaufgaben für neue Mitwirkende markieren", "Label starter tasks for new contributors"),
    steps: [
      { text: L("Öffne die Issues deines Repositories:", "Open the issues of your repository:"), link: { label: "Issues", url: `${u.repo}/issues` } },
      { text: L("Öffne ein kleines, klar umrissenes Issue oder lege mit „New issue“ eines an: Was ist zu tun, in welcher Datei, wie prüft man es?", "Open a small, well-defined issue or create one with “New issue”: what needs doing, in which file, how to check it?") },
      { text: L("Klicke rechts auf „Labels“ und wähle „good first issue“.", "Click “Labels” on the right and choose “good first issue”.") },
      { text: L("Wiederhole das für zwei bis fünf Issues.", "Repeat this for two to five issues.") },
    ],
    note: L("Fehlt das Label, lege es unter Issues → „Labels“ → „New label“ mit dem Namen good first issue an.", "If the label is missing, create it under Issues → “Labels” → “New label” with the name good first issue."),
  }),

  "usability.site_reachable": (ctx, L, u) => ({
    action: L("Website wieder erreichbar machen", "Make the website reachable again"),
    steps: [
      { text: L("Öffne die Adresse aus dem Website-Feld im Browser und prüfe, ob die Seite lädt.", "Open the address from the website field in your browser and check whether the page loads.") },
      { text: L("Nutzt du GitHub Pages, prüfe unter Einstellungen → „Pages“, ob die Veröffentlichung aktiv ist und welche Adresse GitHub anzeigt.", "If you use GitHub Pages, check under Settings → “Pages” whether publishing is active and which address GitHub shows."), link: { label: L("Pages-Einstellungen", "Pages settings"), url: `${u.settings}/pages` } },
      ...aboutSteps(L, u, "Website", L("die richtige Adresse", "the correct address")),
    ],
    note: ctx.snapshot.site?.status ? L(`Zuletzt gemessen: Status ${ctx.snapshot.site.status}.`, `Last measured: status ${ctx.snapshot.site.status}.`) : undefined,
  }),

  "distribution.site_title": (ctx, L, u) => ({
    action: L("Seitentitel der Website setzen", "Set the website page title"),
    steps: [siteEditStep(ctx, L, u), { text: L(HEAD_STEP.de, HEAD_STEP.en) }, commitStep(L)],
    template: { label: L("Vorlage zum Kopieren", "Template to copy"), content: L("<title>[Name]: [Nutzen in wenigen Worten]</title>", "<title>[Name]: [benefit in a few words]</title>") },
  }),

  "distribution.site_description": (ctx, L, u) => ({
    action: L("Meta-Beschreibung der Website ergänzen", "Add a meta description to the website"),
    steps: [siteEditStep(ctx, L, u), { text: L(HEAD_STEP.de, HEAD_STEP.en) }, commitStep(L)],
    template: {
      label: L("Vorlage zum Kopieren", "Template to copy"),
      content: L('<meta name="description" content="[Ein bis zwei Sätze: was die Anwendung für wen leistet]">', '<meta name="description" content="[One or two sentences: what the application does for whom]">'),
    },
    note: L("Gut sind etwa 120 bis 160 Zeichen.", "About 120 to 160 characters work well."),
  }),

  "distribution.site_og_image": (ctx, L, u) => ({
    action: L("Vorschaubild für geteilte Links einrichten", "Set up a preview image for shared links"),
    steps: [
      { text: L("Erstelle ein Bild der Anwendung im Querformat, etwa 1200 × 630 Pixel, zum Beispiel aus einem Screenshot.", "Create a landscape image of the application, about 1200 × 630 pixels, for example from a screenshot.") },
      { text: L("Lade das Bild dorthin hoch, wo die Dateien deiner Website liegen (auf GitHub: „Add file“ → „Upload files“).", "Upload the image to where your website files live (on GitHub: “Add file” → “Upload files”).") },
      siteEditStep(ctx, L, u),
      { text: L(HEAD_STEP.de, HEAD_STEP.en) },
      commitStep(L),
    ],
    template: {
      label: L("Vorlage zum Kopieren", "Template to copy"),
      content: L('<meta property="og:image" content="https://[Adresse deiner Website]/[Bildname].png">', '<meta property="og:image" content="https://[address of your website]/[image name].png">'),
    },
    note: L("Die Adresse muss vollständig sein (mit https://), sonst zeigen viele Dienste das Bild nicht.", "The address must be complete (with https://), otherwise many services do not show the image."),
  }),

  "trust.site_imprint": (ctx, L, u) => ({
    action: L("Impressum prüfen und verlinken", "Check and link a legal notice"),
    steps: [
      { text: L("Prüfe, ob für deine Website ein Impressum nötig oder sinnvoll ist. Im Zweifel rechtlich beraten lassen.", "Check whether your website needs or benefits from a legal notice. Seek legal advice if in doubt.") },
      { text: L("Lege die Seite an, zum Beispiel impressum.html neben der Startdatei.", "Create the page, for example impressum.html next to the start file.") },
      siteEditStep(ctx, L, u),
      { text: L("Füge den Link gut sichtbar ein, zum Beispiel im Fußbereich vor </body>, und ersetze die Platzhalter.", "Insert the link visibly, for example in the footer before </body>, and replace the placeholders.") },
      commitStep(L),
    ],
    template: { label: L("Vorlage für den Link", "Template for the link"), content: L('<a href="[impressum.html]">Impressum</a>', '<a href="[imprint.html]">Legal notice</a>') },
    note: L(LEGAL_GUIDE_NOTE.de, LEGAL_GUIDE_NOTE.en),
  }),

  "trust.site_privacy": (ctx, L, u) => ({
    action: L("Datenschutzerklärung prüfen und verlinken", "Check and link a privacy policy"),
    steps: [
      { text: L("Prüfe, welche Daten deine Website verarbeitet (z. B. Server-Logs, Formulare, Analyse, eingebettete Inhalte) und welche Angaben dafür nötig sind. Im Zweifel rechtlich beraten lassen.", "Check which data your website processes (e.g. server logs, forms, analytics, embedded content) and which information that requires. Seek legal advice if in doubt.") },
      { text: L("Lege die Seite an, zum Beispiel datenschutz.html neben der Startdatei.", "Create the page, for example privacy.html next to the start file.") },
      siteEditStep(ctx, L, u),
      { text: L("Füge den Link gut sichtbar ein, zum Beispiel im Fußbereich vor </body>, und ersetze die Platzhalter.", "Insert the link visibly, for example in the footer before </body>, and replace the placeholders.") },
      commitStep(L),
    ],
    template: { label: L("Vorlage für den Link", "Template for the link"), content: L('<a href="[datenschutz.html]">Datenschutz</a>', '<a href="[privacy.html]">Privacy</a>') },
    note: L(LEGAL_GUIDE_NOTE.de, LEGAL_GUIDE_NOTE.en),
  }),
};

export function buildGuide(ruleId: string, ctx: GuideContext, variant?: string): TaskGuide | undefined {
  const b = GUIDES[ruleId];
  if (!b) return undefined;
  const L = (de: string, en: string) => (ctx.lang === "de" ? de : en);
  return b(ctx, L, urls(ctx.snapshot), variant);
}

export function hasGuide(ruleId: string): boolean {
  return ruleId in GUIDES;
}
